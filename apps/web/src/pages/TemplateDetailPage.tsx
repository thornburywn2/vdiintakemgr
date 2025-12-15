import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Tag,
  Clock,
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
import { templatesApi } from '../services/api';
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
  goldenImageName: string | null;
  baseOS: string | null;
  imageVersion: string | null;
  patchLevel: string | null;
  lastSysprepDate: string | null;
  computeGalleryId: string | null;
  subscriptionId: string | null;
  resourceGroup: string | null;
  hostPoolId: string | null;
  tags: Record<string, string> | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  businessUnit: { id: string; name: string; code: string } | null;
  contact: { id: string; name: string; email: string; department: string | null } | null;
  applications: {
    id: string;
    installOrder: number;
    versionOverride: string | null;
    application: {
      id: string;
      name: string;
      version: string;
      category: string;
    };
  }[];
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'applications', label: 'Applications', icon: AppWindow },
  { id: 'image', label: 'Image', icon: Server },
  { id: 'arm', label: 'ARM Resources', icon: Tag },
  { id: 'notes', label: 'Notes', icon: FileText },
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: template, isLoading, error } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templatesApi.get(id!),
    enabled: !!id && id !== 'new',
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

  if (id === 'new') {
    return <TemplateForm />;
  }

  if (isLoading) {
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
        <Badge variant="outline">{t.loadBalancerType}</Badge>
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
      {activeTab === 'arm' && <ARMTab template={t} />}
      {activeTab === 'notes' && <NotesTab template={t} />}

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
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{t.contact?.name || '-'}</p>
                {t.contact && <p className="text-xs text-muted-foreground">{t.contact.email}</p>}
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
              <p className="text-sm text-muted-foreground">Load Balancer</p>
              <p className="font-medium">{t.loadBalancerType}</p>
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
  const apps = t.applications.sort((a, b) => a.installOrder - b.installOrder);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Applications ({apps.length})</CardTitle>
        <CardDescription>Applications installed in this template</CardDescription>
      </CardHeader>
      <CardContent>
        {apps.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No applications assigned</p>
        ) : (
          <div className="space-y-3">
            {apps.map((ta, index) => (
              <div
                key={ta.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{ta.application.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ta.versionOverride || ta.application.version} - {ta.application.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImageTab({ template: t }: { template: Template }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Golden Image Details</CardTitle>
        <CardDescription>Image configuration and versioning</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Image Name</p>
            <p className="font-medium">{t.goldenImageName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Base OS</p>
            <p className="font-medium">{t.baseOS || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Image Version</p>
            <p className="font-medium">{t.imageVersion || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Patch Level</p>
            <p className="font-medium">{t.patchLevel || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Sysprep</p>
            <p className="font-medium">{t.lastSysprepDate ? formatDate(t.lastSysprepDate) : '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Compute Gallery ID</p>
            <p className="font-mono text-sm break-all">{t.computeGalleryId || '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ARMTab({ template: t }: { template: Template }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Azure Resource IDs</CardTitle>
          <CardDescription>ARM resource identifiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Subscription ID</p>
              <p className="font-mono text-sm break-all">{t.subscriptionId || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resource Group</p>
              <p className="font-mono text-sm">{t.resourceGroup || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Host Pool ID</p>
              <p className="font-mono text-sm break-all">{t.hostPoolId || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {t.tags && Object.keys(t.tags).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Azure Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.tags).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
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

function TemplateForm() {
  const navigate = useNavigate();
  // Placeholder for create/edit form - would be a full form implementation
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/templates')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">New Template</h1>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Template form coming soon...</p>
          <Button className="mt-4" onClick={() => navigate('/templates')}>
            Return to Templates
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
