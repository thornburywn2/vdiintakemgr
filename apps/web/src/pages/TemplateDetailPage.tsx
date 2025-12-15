import { useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  Loader2,
  Building2,
  User,
  Calendar,
  MapPin,
  Server,
  AppWindow,
  FileText,
  Clock,
  History,
  Plus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { templatesApi, businessUnitsApi, applicationsApi, baseImagesApi } from '../services/api';
import { formatDate, formatDateTime, getStatusColor, getEnvironmentColor, cn } from '../lib/utils';
import { toast } from '../hooks/useToast';

interface Template {
  id: string;
  name: string;
  description: string | null;
  status: string;
  environment: string;
  requestDate: string;
  approvedDate: string | null;
  deployedDate: string | null;
  namingPrefix: string;
  namingPattern: string | null;
  hostPoolType: string;
  maxSessionLimit: number | null;
  loadBalancerType: string;
  regions: string[];
  primaryRegion: string;
  contactName: string | null;
  contactEmail: string | null;
  contactTitle: string | null;
  baseImageId: string | null;
  tags: Record<string, string> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  businessUnit: { id: string; name: string; code: string; isVendor?: boolean; vendorCompany?: string } | null;
  contact: { id: string; name: string; email: string; department: string | null } | null;
  baseImage?: { id: string; name: string; displayName: string; osType: string; version: string } | null;
  applications: {
    id: string;
    installOrder: number;
    versionOverride: string | null;
    installNotes: string | null;
    approvalStatus: string;
    approvalNotes: string | null;
    application: {
      id: string;
      name: string;
      displayName: string;
      version: string;
      category: string;
    };
  }[];
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'applications', label: 'Applications', icon: AppWindow },
  { id: 'image', label: 'Image', icon: Server },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'history', label: 'History', icon: History },
];

const statusTransitions: Record<string, string[]> = {
  DRAFT: ['IN_REVIEW'],
  IN_REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['DEPLOYED', 'IN_REVIEW'],
  DEPLOYED: ['DEPRECATED'],
  DEPRECATED: [],
};

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isEditMode = location.pathname.endsWith('/edit');
  const isNewMode = !id;

  const { data: template, isLoading, error } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templatesApi.get(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => templatesApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Status updated', description: 'Template status has been changed.' });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => templatesApi.delete(id!),
    onSuccess: () => {
      toast({ title: 'Template deleted', description: 'The template has been removed.' });
      navigate('/templates');
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete template',
        variant: 'destructive',
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => templatesApi.duplicate(id!),
    onSuccess: (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Template duplicated', description: 'A copy has been created.' });
      navigate(`/templates/${(data as { id: string }).id}`);
    },
    onError: (error) => {
      toast({
        title: 'Duplicate failed',
        description: error instanceof Error ? error.message : 'Failed to duplicate template',
        variant: 'destructive',
      });
    },
  });

  // Show form for new template
  if (isNewMode) {
    return <TemplateForm />;
  }

  // Show loading state (but not for edit mode - we need to load then show form)
  if (isLoading && !isEditMode) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Template not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const t = template as Template;

  // Show edit form when in edit mode
  if (isEditMode) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return <TemplateForm editTemplate={t} />;
  }

  const allowedStatuses = statusTransitions[t.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{t.name}</h1>
          <p className="font-mono text-muted-foreground">{t.namingPrefix}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={t.status}
            onValueChange={(status) => statusMutation.mutate({ status })}
            disabled={allowedStatuses.length === 0 || statusMutation.isPending}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={t.status} disabled>
                {t.status.replace('_', ' ')}
              </SelectItem>
              {allowedStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link to={`/templates/${t.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" onClick={() => duplicateMutation.mutate()}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className={getStatusColor(t.status)} variant="secondary">
          {t.status.replace('_', ' ')}
        </Badge>
        <Badge className={getEnvironmentColor(t.environment)} variant="secondary">
          {t.environment}
        </Badge>
        <Badge variant="outline">{t.hostPoolType}</Badge>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab template={t} />}
      {activeTab === 'applications' && <ApplicationsTab template={t} />}
      {activeTab === 'image' && <ImageTab template={t} />}
      {activeTab === 'notes' && <NotesTab template={t} />}
      {activeTab === 'history' && <HistoryTab templateId={id!} />}

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{t.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OverviewTab({ template: t }: { template: Template }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {t.description && <p className="text-muted-foreground">{t.description}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Business Unit</p>
                <p className="font-medium">{t.businessUnit?.name || '-'}</p>
                {t.businessUnit && <p className="text-xs text-muted-foreground">{t.businessUnit.code}</p>}
                {t.businessUnit?.isVendor && t.businessUnit?.vendorCompany && (
                  <p className="text-xs text-muted-foreground">Vendor: {t.businessUnit.vendorCompany}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{t.contactName || t.contact?.name || '-'}</p>
                {(t.contactEmail || t.contact?.email) && (
                  <p className="text-xs text-muted-foreground">{t.contactEmail || t.contact?.email}</p>
                )}
                {t.contactTitle && <p className="text-xs text-muted-foreground">{t.contactTitle}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Request Date</p>
              <p className="font-medium">{formatDate(t.requestDate)}</p>
            </div>
          </div>
          {t.approvedDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Approved Date</p>
                <p className="font-medium">{formatDate(t.approvedDate)}</p>
              </div>
            </div>
          )}
          {t.deployedDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Deployed Date</p>
                <p className="font-medium">{formatDate(t.deployedDate)}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDateTime(t.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Host Pool Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Pool Type</p>
              <p className="font-medium">{t.hostPoolType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <p className="font-medium">{t.environment}</p>
            </div>
            {t.maxSessionLimit && (
              <div>
                <p className="text-sm text-muted-foreground">Max Sessions</p>
                <p className="font-medium">{t.maxSessionLimit}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Primary Region</p>
              <p className="font-medium">{t.primaryRegion}</p>
            </div>
          </div>
          {t.regions.length > 1 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">All Regions</p>
              <div className="flex flex-wrap gap-2">
                {t.regions.map((r) => (
                  <Badge key={r} variant={r === t.primaryRegion ? 'default' : 'secondary'}>
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicationsTab({ template: t }: { template: Template }) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');

  const apps = t.applications.sort((a, b) => a.installOrder - b.installOrder);
  const assignedAppIds = apps.map(a => a.application.id);

  // Fetch all available applications
  const { data: applicationsData } = useQuery({
    queryKey: ['applications-list'],
    queryFn: () => applicationsApi.list({ limit: 100 }),
    enabled: addDialogOpen,
  });

  const availableApps = ((applicationsData?.data || []) as { id: string; name: string; displayName: string; version: string | null; category: string | null }[])
    .filter(app => !assignedAppIds.includes(app.id));

  const addMutation = useMutation({
    mutationFn: (appId: string) =>
      templatesApi.addApplication(t.id, {
        applicationId: appId,
        isRequired: true,
        installOrder: apps.length,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', t.id] });
      toast({ title: 'Application added', description: 'Application has been added to the template.' });
      setAddDialogOpen(false);
      setSelectedAppId('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to add application',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (applicationId: string) =>
      templatesApi.removeApplication(t.id, applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', t.id] });
      toast({ title: 'Application removed', description: 'Application has been removed from the template.' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to remove application',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'DENIED':
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Applications ({apps.length})</CardTitle>
            <CardDescription>Applications installed in this template</CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <AppWindow className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AppWindow className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No applications assigned</p>
              <Button variant="outline" className="mt-4" onClick={() => setAddDialogOpen(true)}>
                Add your first application
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((ta, index) => (
                <div
                  key={ta.id}
                  className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{ta.application.displayName || ta.application.name}</p>
                      {getApprovalBadge(ta.approvalStatus)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ta.versionOverride || ta.application.version || 'Latest'} - {ta.application.category || 'Uncategorized'}
                    </p>
                    {ta.installNotes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Notes: {ta.installNotes}</p>
                    )}
                    {ta.approvalNotes && (
                      <p className="text-xs text-muted-foreground mt-1">Approval Notes: {ta.approvalNotes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMutation.mutate(ta.application.id)}
                    disabled={removeMutation.isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {removeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Application Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
            <DialogDescription>
              Select an application to add to this template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedAppId} onValueChange={setSelectedAppId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an application" />
              </SelectTrigger>
              <SelectContent>
                {availableApps.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                    No available applications
                  </div>
                ) : (
                  availableApps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.displayName || app.name} {app.version && `(${app.version})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedAppId && addMutation.mutate(selectedAppId)}
              disabled={!selectedAppId || addMutation.isPending}
            >
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ImageTab({ template: t }: { template: Template }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Base Image</CardTitle>
        <CardDescription>Image configuration for this template</CardDescription>
      </CardHeader>
      <CardContent>
        {t.baseImage ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Image Name</p>
              <p className="font-medium">{t.baseImage.displayName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">OS Type</p>
              <p className="font-medium">{t.baseImage.osType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">{t.baseImage.version}</p>
            </div>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No base image selected</p>
        )}
      </CardContent>
    </Card>
  );
}

function NotesTab({ template: t }: { template: Template }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {t.notes ? (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans">{t.notes}</pre>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No notes added</p>
        )}
      </CardContent>
    </Card>
  );
}

interface HistoryEntry {
  id: string;
  templateId: string;
  action: string;
  oldStatus: string | null;
  newStatus: string | null;
  changes: Record<string, unknown> | null;
  comment: string | null;
  userId: string;
  userName: string | null;
  createdAt: string;
}

function HistoryTab({ templateId }: { templateId: string }) {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['template-history', templateId],
    queryFn: () => templatesApi.getHistory(templateId),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load history</p>
        </CardContent>
      </Card>
    );
  }

  const entries = (history as HistoryEntry[]) || [];

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATED': return 'Template Created';
      case 'UPDATED': return 'Template Updated';
      case 'STATUS_CHANGED': return 'Status Changed';
      case 'APP_ADDED': return 'Application Added';
      case 'APP_REMOVED': return 'Application Removed';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'UPDATED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'STATUS_CHANGED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'APP_ADDED': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'APP_REMOVED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Request Journal</CardTitle>
        <CardDescription>Complete history of all changes to this template</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No history entries</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {entries.map((entry, index) => (
                <div key={entry.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-2 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                    index === 0 ? "bg-primary" : "bg-muted"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      index === 0 ? "bg-primary-foreground" : "bg-muted-foreground"
                    )} />
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={getActionColor(entry.action)} variant="secondary">
                        {getActionLabel(entry.action)}
                      </Badge>
                      {entry.oldStatus && entry.newStatus && (
                        <span className="text-sm text-muted-foreground">
                          {entry.oldStatus.replace('_', ' ')} → {entry.newStatus.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{entry.userName || 'System'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDateTime(entry.createdAt)}</span>
                      </div>
                    </div>

                    {entry.comment && (
                      <p className="text-sm border-l-2 pl-3 mt-2 text-muted-foreground italic">
                        "{entry.comment}"
                      </p>
                    )}

                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Changes:</p>
                        <div className="grid gap-1 text-xs">
                          {Object.entries(entry.changes).slice(0, 5).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium text-muted-foreground">{key}:</span>
                              <span className="truncate">{String(value)}</span>
                            </div>
                          ))}
                          {Object.keys(entry.changes).length > 5 && (
                            <p className="text-muted-foreground">
                              +{Object.keys(entry.changes).length - 5} more fields
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TEMPLATE FORM
// ============================================================================

interface TemplateFormData {
  name: string;
  description: string;
  businessUnitId: string;
  // Freeform contact
  contactName: string;
  contactEmail: string;
  contactTitle: string;
  // Config
  environment: string;
  namingPrefix: string;
  hostPoolType: string;
  maxSessionLimit: string;
  // Regions
  primaryRegion: string;
  regions: string[];
  // Base Image
  baseImageId: string;
  // Notes
  notes: string;
  // Applications (selected during creation)
  selectedApplications: {
    applicationId: string;
    installNotes: string;
    approvalStatus: string;
    approvalNotes: string;
  }[];
}

const AZURE_REGIONS = [
  { code: 'eastus2', name: 'East US 2' },
  { code: 'westus2', name: 'West US 2' },
];

const initialFormData: TemplateFormData = {
  name: '',
  description: '',
  businessUnitId: '',
  contactName: '',
  contactEmail: '',
  contactTitle: '',
  environment: 'PILOT',
  namingPrefix: '',
  hostPoolType: 'POOLED',
  maxSessionLimit: '',
  primaryRegion: 'eastus2',
  regions: ['eastus2'],
  baseImageId: '',
  notes: '',
  selectedApplications: [],
};

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  isVendor: boolean;
  vendorCompany: string | null;
}

interface BaseImage {
  id: string;
  name: string;
  displayName: string;
  osType: string;
  version: string;
  patchLevel: string | null;
}

interface Application {
  id: string;
  name: string;
  displayName: string;
  version: string | null;
  category: string | null;
}

function TemplateForm({ editTemplate }: { editTemplate?: Template }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!editTemplate;

  const [formData, setFormData] = useState<TemplateFormData>(() => {
    if (editTemplate) {
      return {
        name: editTemplate.name || '',
        description: editTemplate.description || '',
        businessUnitId: editTemplate.businessUnit?.id || '',
        contactName: editTemplate.contactName || editTemplate.contact?.name || '',
        contactEmail: editTemplate.contactEmail || editTemplate.contact?.email || '',
        contactTitle: editTemplate.contactTitle || '',
        environment: editTemplate.environment || 'PILOT',
        namingPrefix: editTemplate.namingPrefix || '',
        hostPoolType: editTemplate.hostPoolType || 'POOLED',
        maxSessionLimit: editTemplate.maxSessionLimit?.toString() || '',
        primaryRegion: editTemplate.primaryRegion || 'eastus2',
        regions: editTemplate.regions || ['eastus2'],
        baseImageId: editTemplate.baseImageId || '',
        notes: editTemplate.notes || '',
        selectedApplications: editTemplate.applications?.map(a => ({
          applicationId: a.application.id,
          installNotes: a.installNotes || '',
          approvalStatus: a.approvalStatus || 'PENDING',
          approvalNotes: a.approvalNotes || '',
        })) || [],
      };
    }
    return initialFormData;
  });

  const [activeSection, setActiveSection] = useState('basic');
  const [showNewBUDialog, setShowNewBUDialog] = useState(false);
  const [newBU, setNewBU] = useState({ name: '', code: '', isVendor: false, vendorCompany: '' });

  // Fetch business units
  const { data: businessUnitsData, refetch: refetchBUs } = useQuery({
    queryKey: ['business-units-form'],
    queryFn: () => businessUnitsApi.list({ limit: 100 }),
  });

  // Fetch base images
  const { data: baseImagesData } = useQuery({
    queryKey: ['base-images'],
    queryFn: () => baseImagesApi.list(),
  });

  // Fetch applications
  const { data: applicationsData } = useQuery({
    queryKey: ['applications-form'],
    queryFn: () => applicationsApi.list({ limit: 100 }),
  });

  const businessUnits = (businessUnitsData?.data || []) as BusinessUnit[];
  const baseImages = (baseImagesData || []) as BaseImage[];
  const applications = (applicationsData?.data || []) as Application[];

  // Create business unit mutation
  const createBUMutation = useMutation({
    mutationFn: (data: { name: string; code: string; isVendor: boolean; vendorCompany?: string }) =>
      businessUnitsApi.create(data),
    onSuccess: (result: unknown) => {
      refetchBUs();
      const newBUId = (result as { id: string }).id;
      setFormData(prev => ({ ...prev, businessUnitId: newBUId }));
      setShowNewBUDialog(false);
      setNewBU({ name: '', code: '', isVendor: false, vendorCompany: '' });
      toast({ title: 'Business Unit created', description: 'New business unit has been added.' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create business unit',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: unknown) => templatesApi.create(data),
    onSuccess: (result: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({ title: 'Template created', description: 'New template has been created successfully.' });
      navigate(`/templates/${(result as { id: string }).id}`);
    },
    onError: (error) => {
      toast({
        title: 'Creation failed',
        description: error instanceof Error ? error.message : 'Failed to create template',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: unknown) => templatesApi.update(editTemplate!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', editTemplate!.id] });
      toast({ title: 'Template updated', description: 'Changes have been saved successfully.' });
      navigate(`/templates/${editTemplate!.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update template',
        variant: 'destructive',
      });
    },
  });

  const handleChange = (field: keyof TemplateFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegionToggle = (regionCode: string) => {
    setFormData(prev => {
      const newRegions = prev.regions.includes(regionCode)
        ? prev.regions.filter(r => r !== regionCode)
        : [...prev.regions, regionCode];

      // Ensure primary region is in regions list
      if (!newRegions.includes(prev.primaryRegion) && newRegions.length > 0) {
        return { ...prev, regions: newRegions, primaryRegion: newRegions[0] };
      }
      return { ...prev, regions: newRegions };
    });
  };

  const handleAppToggle = (appId: string) => {
    setFormData(prev => {
      const exists = prev.selectedApplications.find(a => a.applicationId === appId);
      if (exists) {
        return {
          ...prev,
          selectedApplications: prev.selectedApplications.filter(a => a.applicationId !== appId),
        };
      }
      return {
        ...prev,
        selectedApplications: [
          ...prev.selectedApplications,
          { applicationId: appId, installNotes: '', approvalStatus: 'PENDING', approvalNotes: '' },
        ],
      };
    });
  };

  const handleAppFieldChange = (appId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      selectedApplications: prev.selectedApplications.map(a =>
        a.applicationId === appId ? { ...a, [field]: value } : a
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description || null,
      businessUnitId: formData.businessUnitId,
      contactName: formData.contactName || null,
      contactEmail: formData.contactEmail || null,
      contactTitle: formData.contactTitle || null,
      environment: formData.environment,
      namingPrefix: formData.namingPrefix,
      hostPoolType: formData.hostPoolType,
      maxSessionLimit: formData.maxSessionLimit ? parseInt(formData.maxSessionLimit) : null,
      loadBalancerType: 'BREADTH_FIRST', // Default value since removed from UI
      primaryRegion: formData.primaryRegion,
      regions: formData.regions.length > 0 ? formData.regions : [formData.primaryRegion],
      baseImageId: formData.baseImageId || null,
      notes: formData.notes || null,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'config', label: 'Configuration' },
    { id: 'regions', label: 'Regions' },
    { id: 'image', label: 'Base Image' },
    { id: 'apps', label: 'Applications' },
    { id: 'notes', label: 'Notes' },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Generate naming preview
  const selectedBU = businessUnits.find(bu => bu.id === formData.businessUnitId);
  const envCode = formData.environment === 'PRODUCTION' ? 'p' : formData.environment === 'STAGING' ? 't' : formData.environment === 'PILOT' ? 'pi' : 'd';
  const regionCode = formData.primaryRegion === 'eastus2' ? 'eus2' : 'wus2';
  const namingPreview = formData.namingPrefix || (selectedBU
    ? `vdpool-${selectedBU.code.toLowerCase()}-${envCode}-${regionCode}`
    : 'vdpool-{bu}-{env}-{region}');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(isEdit ? `/templates/${editTemplate.id}` : '/templates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{isEdit ? 'Edit Template' : 'New Template'}</h1>
        </div>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>

      {/* Section Navigation */}
      <div className="border-b">
        <nav className="flex gap-4 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                activeSection === section.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info Section */}
        {activeSection === 'basic' && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Template name, description, and ownership</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Template Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Finance Team Host Pool"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of this template's purpose..."
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                {/* Business Unit with Create New option */}
                <div className="space-y-2">
                  <label htmlFor="businessUnit" className="text-sm font-medium">
                    Business Unit <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.businessUnitId}
                      onValueChange={(v) => handleChange('businessUnitId', v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select business unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessUnits.map((bu) => (
                          <SelectItem key={bu.id} value={bu.id}>
                            {bu.name} ({bu.code}) {bu.isVendor && `- ${bu.vendorCompany}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setShowNewBUDialog(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Naming Preview */}
                <div className="space-y-2">
                  <label htmlFor="namingPrefix" className="text-sm font-medium">
                    Naming Prefix <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="namingPrefix"
                    type="text"
                    required
                    value={formData.namingPrefix}
                    onChange={(e) => handleChange('namingPrefix', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder={namingPreview}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">Suggested: {namingPreview}</p>
                </div>

                {/* Freeform Contact Fields */}
                <div className="space-y-2 sm:col-span-2">
                  <h3 className="text-sm font-medium border-b pb-2">Contact Information</h3>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactName" className="text-sm font-medium">Contact Name</label>
                  <input
                    id="contactName"
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    placeholder="e.g., John Smith"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactEmail" className="text-sm font-medium">Contact Email</label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="e.g., john.smith@company.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactTitle" className="text-sm font-medium">Contact Title</label>
                  <input
                    id="contactTitle"
                    type="text"
                    value={formData.contactTitle}
                    onChange={(e) => handleChange('contactTitle', e.target.value)}
                    placeholder="e.g., IT Manager"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Section */}
        {activeSection === 'config' && (
          <Card>
            <CardHeader>
              <CardTitle>Host Pool Configuration</CardTitle>
              <CardDescription>Environment and host pool settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Environment <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.environment}
                    onValueChange={(v) => handleChange('environment', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PILOT">Pilot</SelectItem>
                      <SelectItem value="DEVELOPMENT">Development</SelectItem>
                      <SelectItem value="STAGING">Staging</SelectItem>
                      <SelectItem value="PRODUCTION">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Host Pool Type <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.hostPoolType}
                    onValueChange={(v) => handleChange('hostPoolType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POOLED">Pooled</SelectItem>
                      <SelectItem value="PERSONAL">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxSessions" className="text-sm font-medium">Max Session Limit</label>
                  <input
                    id="maxSessions"
                    type="number"
                    min="1"
                    max="999999"
                    value={formData.maxSessionLimit}
                    onChange={(e) => handleChange('maxSessionLimit', e.target.value)}
                    placeholder="e.g., 10"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regions Section */}
        {activeSection === 'regions' && (
          <Card>
            <CardHeader>
              <CardTitle>Regions</CardTitle>
              <CardDescription>Select deployment regions for this template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Primary Region <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.primaryRegion}
                  onValueChange={(v) => {
                    handleChange('primaryRegion', v);
                    if (!formData.regions.includes(v)) {
                      handleChange('regions', [...formData.regions, v]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AZURE_REGIONS.map((region) => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Available Regions</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {AZURE_REGIONS.map((region) => (
                    <label
                      key={region.code}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors",
                        formData.regions.includes(region.code)
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={formData.regions.includes(region.code)}
                        onChange={() => handleRegionToggle(region.code)}
                        className="h-4 w-4 rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{region.name}</span>
                        {region.code === formData.primaryRegion && (
                          <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Base Image Section */}
        {activeSection === 'image' && (
          <Card>
            <CardHeader>
              <CardTitle>Base Image</CardTitle>
              <CardDescription>Select the base image for this template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Image</label>
                <Select
                  value={formData.baseImageId}
                  onValueChange={(v) => handleChange('baseImageId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a base image" />
                  </SelectTrigger>
                  <SelectContent>
                    {baseImages.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                        No base images available
                      </div>
                    ) : (
                      baseImages.map((img) => (
                        <SelectItem key={img.id} value={img.id}>
                          {img.displayName} - {img.osType} (v{img.version})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {formData.baseImageId && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  {(() => {
                    const selectedImage = baseImages.find(i => i.id === formData.baseImageId);
                    if (!selectedImage) return null;
                    return (
                      <div className="grid gap-2 text-sm">
                        <div><span className="font-medium">Name:</span> {selectedImage.displayName}</div>
                        <div><span className="font-medium">OS:</span> {selectedImage.osType}</div>
                        <div><span className="font-medium">Version:</span> {selectedImage.version}</div>
                        {selectedImage.patchLevel && (
                          <div><span className="font-medium">Patch Level:</span> {selectedImage.patchLevel}</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Applications Section */}
        {activeSection === 'apps' && (
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Select applications to include in this template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications available in the catalog
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const isSelected = formData.selectedApplications.some(a => a.applicationId === app.id);
                    const selectedApp = formData.selectedApplications.find(a => a.applicationId === app.id);

                    return (
                      <div
                        key={app.id}
                        className={cn(
                          "rounded-lg border p-4 transition-colors",
                          isSelected ? "border-primary bg-primary/5" : "border-input"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAppToggle(app.id)}
                            className="h-4 w-4 mt-1 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{app.displayName || app.name}</span>
                              {app.version && (
                                <Badge variant="outline" className="text-xs">{app.version}</Badge>
                              )}
                              {app.category && (
                                <Badge variant="secondary" className="text-xs">{app.category}</Badge>
                              )}
                            </div>

                            {isSelected && selectedApp && (
                              <div className="mt-3 space-y-3 pt-3 border-t">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">Install Notes</label>
                                  <textarea
                                    value={selectedApp.installNotes}
                                    onChange={(e) => handleAppFieldChange(app.id, 'installNotes', e.target.value)}
                                    placeholder="Any special installation notes..."
                                    rows={2}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">Approval Status</label>
                                    <Select
                                      value={selectedApp.approvalStatus}
                                      onValueChange={(v) => handleAppFieldChange(app.id, 'approvalStatus', v)}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="DENIED">Denied</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-medium">Approval Notes</label>
                                    <input
                                      type="text"
                                      value={selectedApp.approvalNotes}
                                      onChange={(e) => handleAppFieldChange(app.id, 'approvalNotes', e.target.value)}
                                      placeholder="Approval/denial reason..."
                                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes Section */}
        {activeSection === 'notes' && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Additional information and documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any additional notes, requirements, or documentation..."
                rows={10}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </CardContent>
          </Card>
        )}

        {/* Submit Button (mobile) */}
        <div className="flex justify-end pt-4 sm:hidden">
          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </form>

      {/* Create Business Unit Dialog */}
      <Dialog open={showNewBUDialog} onOpenChange={setShowNewBUDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Business Unit</DialogTitle>
            <DialogDescription>
              Add a new business unit or vendor company
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={newBU.name}
                onChange={(e) => setNewBU(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Finance Department"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Code <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={newBU.code}
                onChange={(e) => setNewBU(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') }))}
                placeholder="e.g., FIN"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVendor"
                checked={newBU.isVendor}
                onChange={(e) => setNewBU(prev => ({ ...prev, isVendor: e.target.checked }))}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="isVendor" className="text-sm font-medium">This is a vendor/external company</label>
            </div>

            {newBU.isVendor && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Company Name</label>
                <input
                  type="text"
                  value={newBU.vendorCompany}
                  onChange={(e) => setNewBU(prev => ({ ...prev, vendorCompany: e.target.value }))}
                  placeholder="e.g., Microsoft, Acme Corp"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBUDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createBUMutation.mutate({
                name: newBU.name,
                code: newBU.code,
                isVendor: newBU.isVendor,
                vendorCompany: newBU.isVendor ? newBU.vendorCompany : undefined,
              })}
              disabled={!newBU.name || !newBU.code || createBUMutation.isPending}
            >
              {createBUMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
