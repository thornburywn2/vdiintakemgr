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
  Building2,
  Filter,
  Users,
  FileStack,
  ExternalLink,
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
import { businessUnitsApi } from '../services/api';
import { toast } from '../hooks/useToast';

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  description: string | null;
  costCenter: string | null;
  isVendor: boolean;
  vendorCompany: string | null;
  isActive: boolean;
  _count?: { templates: number; contacts: number };
}

export default function BusinessUnitsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editBU, setEditBU] = useState<BusinessUnit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isVendor, setIsVendor] = useState(false);

  const { data: busData, isLoading } = useQuery({
    queryKey: ['business-units', { search, isVendor: vendorFilter, page }],
    queryFn: () =>
      businessUnitsApi.list({
        search: search || undefined,
        isVendor: vendorFilter === 'all' ? undefined : vendorFilter === 'vendor',
        page,
        limit: 15,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: unknown) => businessUnitsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-units'] });
      toast({ title: 'Business unit created', description: 'New business unit has been added.' });
      setFormOpen(false);
      setEditBU(null);
    },
    onError: (error) => {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Failed to create business unit',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => businessUnitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-units'] });
      toast({ title: 'Business unit updated', description: 'Changes have been saved.' });
      setFormOpen(false);
      setEditBU(null);
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update business unit',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => businessUnitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-units'] });
      toast({ title: 'Business unit deleted', description: 'The business unit has been removed.' });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete business unit',
        variant: 'destructive',
      });
    },
  });

  const businessUnits = (busData?.data || []) as BusinessUnit[];
  const pagination = busData?.pagination;

  // Filter by status client-side
  const filteredUnits = statusFilter === 'all'
    ? businessUnits
    : businessUnits.filter(bu => statusFilter === 'active' ? bu.isActive : !bu.isActive);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      code: (formData.get('code') as string).toUpperCase().replace(/[^A-Z0-9-]/g, ''),
      description: formData.get('description') as string || null,
      costCenter: formData.get('costCenter') as string || null,
      isVendor: formData.get('isVendor') === 'true',
      vendorCompany: formData.get('vendorCompany') as string || null,
      isActive: formData.get('isActive') !== 'false',
    };

    if (editBU) {
      updateMutation.mutate({ id: editBU.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditForm = (bu: BusinessUnit) => {
    setEditBU(bu);
    setIsVendor(bu.isVendor);
    setFormOpen(true);
  };

  const openCreateForm = () => {
    setEditBU(null);
    setIsVendor(false);
    setFormOpen(true);
  };

  // Stats
  const totalCount = pagination?.total || 0;
  const internalCount = businessUnits.filter(bu => !bu.isVendor).length;
  const vendorCount = businessUnits.filter(bu => bu.isVendor).length;
  const totalTemplates = businessUnits.reduce((sum, bu) => sum + (bu._count?.templates || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Units</h1>
          <p className="text-muted-foreground">Manage internal departments and external vendors</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Business Unit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Internal</p>
                <p className="text-2xl font-bold">{internalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <ExternalLink className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendors</p>
                <p className="text-2xl font-bold">{vendorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-100 p-3">
                <FileStack className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Templates</p>
                <p className="text-2xl font-bold">{totalTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All Business Units</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 w-[200px]"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={vendorFilter} onValueChange={(v) => { setVendorFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
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
          ) : filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No business units found</p>
              <Button className="mt-4" variant="outline" onClick={openCreateForm}>
                Add your first business unit
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Vendor Company</TableHead>
                    <TableHead>Cost Center</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Templates</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.map((bu) => (
                    <TableRow key={bu.id} className={!bu.isActive ? 'opacity-60' : ''}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{bu.name}</span>
                          {bu.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {bu.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{bu.code}</TableCell>
                      <TableCell>
                        {bu.isVendor ? (
                          <Badge className="bg-purple-100 text-purple-800">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Vendor
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Users className="mr-1 h-3 w-3" />
                            Internal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {bu.vendorCompany ? (
                          <span className="text-sm">{bu.vendorCompany}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{bu.costCenter || '-'}</TableCell>
                      <TableCell>
                        {bu.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{bu._count?.templates ?? 0}</TableCell>
                      <TableCell>{bu._count?.contacts ?? 0}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditForm(bu)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(bu.id)}
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
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editBU ? 'Edit Business Unit' : 'Add Business Unit'}</DialogTitle>
            <DialogDescription>
              {editBU ? 'Update business unit details.' : 'Add a new internal department or external vendor.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editBU?.name}
                required
                placeholder="e.g., Finance Department"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={editBU?.code}
                  required
                  placeholder="e.g., FIN"
                  className="font-mono uppercase"
                />
                <p className="text-xs text-muted-foreground">Short identifier (A-Z, 0-9)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isVendor">Type *</Label>
                <Select
                  name="isVendor"
                  defaultValue={editBU?.isVendor ? 'true' : 'false'}
                  onValueChange={(v) => setIsVendor(v === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Internal Department</SelectItem>
                    <SelectItem value="true">External Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isVendor && (
              <div className="space-y-2">
                <Label htmlFor="vendorCompany">Vendor Company Name</Label>
                <Input
                  id="vendorCompany"
                  name="vendorCompany"
                  defaultValue={editBU?.vendorCompany || ''}
                  placeholder="e.g., Microsoft, Acme Corp, Contoso"
                />
                <p className="text-xs text-muted-foreground">The name of the external company</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costCenter">Cost Center</Label>
                <Input
                  id="costCenter"
                  name="costCenter"
                  defaultValue={editBU?.costCenter || ''}
                  placeholder="e.g., CC-1234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select name="isActive" defaultValue={editBU?.isActive === false ? 'false' : 'true'}>
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editBU?.description || ''}
                placeholder="Brief description of this business unit..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editBU ? 'Save Changes' : 'Add Business Unit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Business Unit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this business unit? This may affect templates and contacts associated with it.
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
