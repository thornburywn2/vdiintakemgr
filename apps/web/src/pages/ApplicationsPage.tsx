import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
  Check,
  X,
  Download,
  DollarSign,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
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
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { applicationsApi } from '../services/api';
import { toast } from '../hooks/useToast';
import { cn } from '../lib/utils';

interface Application {
  id: string;
  name: string;
  displayName: string;
  version: string | null;
  category: string | null;
  publisher: string | null;
  description: string | null;
  isMsixAppAttach: boolean;
  msixPackagePath: string | null;
  msixImagePath: string | null;
  msixCertificate: string | null;
  licenseRequired: boolean;
  licenseType: string | null;
  licenseVendor: string | null;
  licenseSku: string | null;
  licenseCost: number | null;
  licenseNotes: string | null;
  installCommand: string | null;
  uninstallCommand: string | null;
  installSize: string | null;
  isActive: boolean;
  _count?: { templates: number };
}

const categories = [
  'Productivity',
  'Browser',
  'Communication',
  'Development',
  'Design',
  'Security',
  'Utilities',
  'Business',
  'Media',
  'Other',
];

const formSections = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'msix', label: 'MSIX App Attach' },
  { id: 'license', label: 'Licensing' },
  { id: 'install', label: 'Installation' },
];

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formSection, setFormSection] = useState('basic');

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['applications', { search, category: categoryFilter, status: statusFilter, page }],
    queryFn: () =>
      applicationsApi.list({
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        page,
        limit: 15,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: unknown) => applicationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: 'Application created', description: 'New application has been added to the catalog.' });
      setFormOpen(false);
      setEditApp(null);
      setFormSection('basic');
    },
    onError: (error) => {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Failed to create application',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => applicationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: 'Application updated', description: 'Changes have been saved.' });
      setFormOpen(false);
      setEditApp(null);
      setFormSection('basic');
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update application',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: 'Application deleted', description: 'The application has been removed from the catalog.' });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete application',
        variant: 'destructive',
      });
    },
  });

  const applications = (appsData?.data || []) as Application[];
  const pagination = appsData?.pagination;

  // Filter by status client-side if needed
  const filteredApps = statusFilter === 'all'
    ? applications
    : applications.filter(app => statusFilter === 'active' ? app.isActive : !app.isActive);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: (formData.get('name') as string).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      displayName: formData.get('displayName') as string,
      version: formData.get('version') as string || null,
      category: formData.get('category') as string || null,
      publisher: formData.get('publisher') as string || null,
      description: formData.get('description') as string || null,
      isMsixAppAttach: formData.get('isMsixAppAttach') === 'true',
      msixPackagePath: formData.get('msixPackagePath') as string || null,
      msixImagePath: formData.get('msixImagePath') as string || null,
      msixCertificate: formData.get('msixCertificate') as string || null,
      licenseRequired: formData.get('licenseRequired') === 'true',
      licenseType: formData.get('licenseType') as string || null,
      licenseVendor: formData.get('licenseVendor') as string || null,
      licenseSku: formData.get('licenseSku') as string || null,
      licenseCost: formData.get('licenseCost') ? parseFloat(formData.get('licenseCost') as string) : null,
      licenseNotes: formData.get('licenseNotes') as string || null,
      installCommand: formData.get('installCommand') as string || null,
      uninstallCommand: formData.get('uninstallCommand') as string || null,
      installSize: formData.get('installSize') as string || null,
      isActive: formData.get('isActive') !== 'false',
    };

    if (editApp) {
      updateMutation.mutate({ id: editApp.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditForm = (app: Application) => {
    setEditApp(app);
    setFormSection('basic');
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Manage your software catalog for AVD templates</p>
        </div>
        <Button onClick={() => { setEditApp(null); setFormSection('basic'); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Apps</p>
                <p className="text-2xl font-bold">{pagination?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{applications.filter(a => a.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MSIX Apps</p>
                <p className="text-2xl font-bold">{applications.filter(a => a.isMsixAppAttach).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-100 p-3">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Licensed</p>
                <p className="text-2xl font-bold">{applications.filter(a => a.licenseRequired).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Application Catalog</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  className="pl-8 w-[200px]"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No applications found</p>
              <Button className="mt-4" variant="outline" onClick={() => setFormOpen(true)}>
                Add your first application
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Publisher</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Templates</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.id} className={!app.isActive ? 'opacity-60' : ''}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{app.displayName}</span>
                          <p className="text-xs text-muted-foreground font-mono">{app.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{app.version || '-'}</TableCell>
                      <TableCell>
                        {app.category ? (
                          <Badge variant="secondary">{app.category}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{app.publisher || '-'}</TableCell>
                      <TableCell>
                        {app.isMsixAppAttach ? (
                          <Badge className="bg-blue-100 text-blue-800">MSIX</Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.licenseRequired ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            {app.licenseType || 'Required'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{app._count?.templates ?? 0}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditForm(app)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(app.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Page {page} of {pagination.totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === pagination.totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setFormSection('basic'); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editApp ? 'Edit Application' : 'Add Application'}</DialogTitle>
            <DialogDescription>
              {editApp ? 'Update application details in the catalog.' : 'Add a new application to your software catalog.'}
            </DialogDescription>
          </DialogHeader>

          {/* Section Navigation */}
          <div className="border-b">
            <nav className="flex gap-4">
              {formSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setFormSection(section.id)}
                  className={cn(
                    'whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors',
                    formSection === section.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info Section */}
            {formSection === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      defaultValue={editApp?.displayName}
                      required
                      placeholder="e.g., Microsoft Office 365"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Package Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editApp?.name}
                      required
                      placeholder="e.g., microsoft-office-365"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">Lowercase, hyphens only</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input id="version" name="version" defaultValue={editApp?.version || ''} placeholder="e.g., 2024.1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={editApp?.category || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input id="publisher" name="publisher" defaultValue={editApp?.publisher || ''} placeholder="e.g., Microsoft" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editApp?.description || ''}
                    placeholder="Brief description of the application..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <Select name="isActive" defaultValue={editApp?.isActive === false ? 'false' : 'true'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* MSIX Section */}
            {formSection === 'msix' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="isMsixAppAttach">MSIX App Attach</Label>
                  <Select name="isMsixAppAttach" defaultValue={editApp?.isMsixAppAttach ? 'true' : 'false'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No - Standard Installation</SelectItem>
                      <SelectItem value="true">Yes - MSIX App Attach</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">MSIX App Attach enables faster login and reduced storage</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msixPackagePath">MSIX Package Path</Label>
                  <Input
                    id="msixPackagePath"
                    name="msixPackagePath"
                    defaultValue={editApp?.msixPackagePath || ''}
                    placeholder="\\server\share\app.msix"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msixImagePath">MSIX Image Path (VHD/VHDX)</Label>
                  <Input
                    id="msixImagePath"
                    name="msixImagePath"
                    defaultValue={editApp?.msixImagePath || ''}
                    placeholder="\\server\share\app.vhdx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msixCertificate">Signing Certificate</Label>
                  <Input
                    id="msixCertificate"
                    name="msixCertificate"
                    defaultValue={editApp?.msixCertificate || ''}
                    placeholder="Certificate thumbprint or name"
                  />
                </div>
              </div>
            )}

            {/* License Section */}
            {formSection === 'license' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseRequired">License Required</Label>
                  <Select name="licenseRequired" defaultValue={editApp?.licenseRequired ? 'true' : 'false'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No - Free / Open Source</SelectItem>
                      <SelectItem value="true">Yes - Licensed Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseType">License Type</Label>
                    <Select name="licenseType" defaultValue={editApp?.licenseType || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Per User">Per User</SelectItem>
                        <SelectItem value="Per Device">Per Device</SelectItem>
                        <SelectItem value="Concurrent">Concurrent</SelectItem>
                        <SelectItem value="Site License">Site License</SelectItem>
                        <SelectItem value="Subscription">Subscription</SelectItem>
                        <SelectItem value="Volume">Volume</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseVendor">License Vendor</Label>
                    <Input id="licenseVendor" name="licenseVendor" defaultValue={editApp?.licenseVendor || ''} placeholder="e.g., SHI, CDW" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseSku">License SKU</Label>
                    <Input id="licenseSku" name="licenseSku" defaultValue={editApp?.licenseSku || ''} placeholder="e.g., ABC-123-XYZ" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseCost">Cost per License ($)</Label>
                    <Input
                      id="licenseCost"
                      name="licenseCost"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={editApp?.licenseCost || ''}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNotes">License Notes</Label>
                  <Textarea
                    id="licenseNotes"
                    name="licenseNotes"
                    defaultValue={editApp?.licenseNotes || ''}
                    placeholder="Additional licensing information, renewal dates, etc..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Installation Section */}
            {formSection === 'install' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="installCommand">Install Command</Label>
                  <Textarea
                    id="installCommand"
                    name="installCommand"
                    defaultValue={editApp?.installCommand || ''}
                    placeholder="e.g., msiexec /i app.msi /qn"
                    rows={2}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uninstallCommand">Uninstall Command</Label>
                  <Textarea
                    id="uninstallCommand"
                    name="uninstallCommand"
                    defaultValue={editApp?.uninstallCommand || ''}
                    placeholder="e.g., msiexec /x {ProductCode} /qn"
                    rows={2}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installSize">Approximate Install Size</Label>
                  <Input
                    id="installSize"
                    name="installSize"
                    defaultValue={editApp?.installSize || ''}
                    placeholder="e.g., 2.5 GB"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editApp ? 'Save Changes' : 'Add Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this application? This will remove it from all templates that reference it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
