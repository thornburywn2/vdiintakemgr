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
  Users,
  Mail,
  Phone,
  Building2,
  Star,
  Filter,
  FileStack,
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
import { contactsApi, businessUnitsApi } from '../services/api';
import { toast } from '../hooks/useToast';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  title: string | null;
  isPrimary: boolean;
  notes: string | null;
  businessUnit?: { id: string; name: string; code: string } | null;
  _count?: { templates: number };
}

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [buFilter, setBuFilter] = useState<string>('all');
  const [primaryFilter, setPrimaryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', { search, businessUnit: buFilter, page }],
    queryFn: () =>
      contactsApi.list({
        search: search || undefined,
        businessUnitId: buFilter !== 'all' ? buFilter : undefined,
        page,
        limit: 15,
      }),
  });

  const { data: busData } = useQuery({
    queryKey: ['business-units-list'],
    queryFn: () => businessUnitsApi.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: unknown) => contactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact created', description: 'New contact has been added.' });
      setFormOpen(false);
      setEditContact(null);
    },
    onError: (error) => {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Failed to create contact',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => contactsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact updated', description: 'Changes have been saved.' });
      setFormOpen(false);
      setEditContact(null);
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update contact',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact deleted', description: 'The contact has been removed.' });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete contact',
        variant: 'destructive',
      });
    },
  });

  const contacts = (contactsData?.data || []) as Contact[];
  const businessUnits = ((busData?.data || []) as BusinessUnit[]);
  const pagination = contactsData?.pagination;

  // Filter by primary status client-side
  const filteredContacts = primaryFilter === 'all'
    ? contacts
    : contacts.filter(c => primaryFilter === 'primary' ? c.isPrimary : !c.isPrimary);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || null,
      department: formData.get('department') as string || null,
      title: formData.get('title') as string || null,
      isPrimary: formData.get('isPrimary') === 'true',
      notes: formData.get('notes') as string || null,
      businessUnitId: formData.get('businessUnitId') as string || null,
    };

    if (editContact) {
      updateMutation.mutate({ id: editContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditForm = (contact: Contact) => {
    setEditContact(contact);
    setFormOpen(true);
  };

  // Stats
  const totalCount = pagination?.total || 0;
  const primaryCount = contacts.filter(c => c.isPrimary).length;
  const withBUCount = contacts.filter(c => c.businessUnit).length;
  const totalTemplates = contacts.reduce((sum, c) => sum + (c._count?.templates || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage contact directory for templates</p>
        </div>
        <Button onClick={() => { setEditContact(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-amber-100 p-3">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Primary Contacts</p>
                <p className="text-2xl font-bold">{primaryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">With Business Unit</p>
                <p className="text-2xl font-bold">{withBUCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <FileStack className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">On Templates</p>
                <p className="text-2xl font-bold">{totalTemplates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All Contacts</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-8 w-[200px]"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={buFilter} onValueChange={(v) => { setBuFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Business Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  {businessUnits.map((bu) => (
                    <SelectItem key={bu.id} value={bu.id}>{bu.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={primaryFilter} onValueChange={(v) => { setPrimaryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="primary">Primary Only</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
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
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No contacts found</p>
              <Button className="mt-4" variant="outline" onClick={() => setFormOpen(true)}>
                Add your first contact
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Templates</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {contact.isPrimary && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                          <div>
                            <span className="font-medium">{contact.name}</span>
                            {contact.title && (
                              <p className="text-xs text-muted-foreground">{contact.title}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:underline text-sm">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:underline text-sm">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{contact.department || '-'}</TableCell>
                      <TableCell>
                        {contact.businessUnit ? (
                          <Badge variant="outline">
                            {contact.businessUnit.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.isPrimary ? (
                          <Badge className="bg-amber-100 text-amber-800">
                            <Star className="mr-1 h-3 w-3" />
                            Primary
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Secondary</Badge>
                        )}
                      </TableCell>
                      <TableCell>{contact._count?.templates ?? 0}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditForm(contact)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(contact.id)}
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
            <DialogTitle>{editContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            <DialogDescription>
              {editContact ? 'Update contact details.' : 'Add a new contact to the directory.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" defaultValue={editContact?.name} required placeholder="Full name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" defaultValue={editContact?.email} required placeholder="email@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={editContact?.phone || ''} placeholder="+1 (555) 123-4567" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={editContact?.title || ''} placeholder="e.g., IT Manager" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" defaultValue={editContact?.department || ''} placeholder="e.g., Information Technology" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessUnitId">Business Unit</Label>
                <Select name="businessUnitId" defaultValue={editContact?.businessUnit?.id || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {businessUnits.map((bu) => (
                      <SelectItem key={bu.id} value={bu.id}>{bu.name} ({bu.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isPrimary">Contact Role</Label>
                <Select name="isPrimary" defaultValue={editContact?.isPrimary ? 'true' : 'false'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Secondary Contact</SelectItem>
                    <SelectItem value="true">Primary Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" defaultValue={editContact?.notes || ''} placeholder="Additional notes about this contact..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editContact ? 'Save Changes' : 'Add Contact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This may affect templates that reference this contact.
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
