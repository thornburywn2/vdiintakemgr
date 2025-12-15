import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  Eye,
  Calendar,
  User,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
  LogIn,
  LogOut,
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
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { auditApi } from '../services/api';
import { formatDateTime, formatDate } from '../lib/utils';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CREATE: Plus,
  CREATED: Plus,
  UPDATE: Edit,
  UPDATED: Edit,
  DELETE: Trash2,
  DELETED: Trash2,
  STATUS_CHANGE: ArrowRight,
  STATUS_CHANGED: ArrowRight,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  VIEW: Eye,
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CREATED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  UPDATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  DELETED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  STATUS_CHANGE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  STATUS_CHANGED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  LOGIN: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  VIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

const entityTypeColors: Record<string, string> = {
  TEMPLATE: 'bg-indigo-100 text-indigo-800',
  APPLICATION: 'bg-teal-100 text-teal-800',
  BUSINESS_UNIT: 'bg-orange-100 text-orange-800',
  CONTACT: 'bg-pink-100 text-pink-800',
  USER: 'bg-violet-100 text-violet-800',
  BASE_IMAGE: 'bg-sky-100 text-sky-800',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', { search, entityType: entityTypeFilter, action: actionFilter, page }],
    queryFn: () =>
      auditApi.list({
        entityType: entityTypeFilter !== 'all' ? entityTypeFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        page,
        limit: 20,
      }),
  });

  const logs = (logsData?.data || []) as AuditLog[];
  const pagination = logsData?.pagination;

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calculate stats
  const todayCount = logs.filter(l => {
    const logDate = new Date(l.createdAt).toDateString();
    const today = new Date().toDateString();
    return logDate === today;
  }).length;

  const uniqueUsers = new Set(logs.map(l => l.user?.id).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">System activity and change history</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{pagination?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entity Types</p>
                <p className="text-2xl font-bold">{new Set(logs.map(l => l.entityType)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Activity History</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-8 w-[180px]"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="TEMPLATE">Template</SelectItem>
                  <SelectItem value="APPLICATION">Application</SelectItem>
                  <SelectItem value="BUSINESS_UNIT">Business Unit</SelectItem>
                  <SelectItem value="CONTACT">Contact</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="BASE_IMAGE">Base Image</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="CREATED">Created</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="UPDATED">Updated</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="DELETED">Deleted</SelectItem>
                  <SelectItem value="STATUS_CHANGE">Status Change</SelectItem>
                  <SelectItem value="STATUS_CHANGED">Status Changed</SelectItem>
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
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-1">Activity will appear here as changes are made</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]" />
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const ActionIcon = actionIcons[log.action] || FileText;
                    const isExpanded = expandedRows.has(log.id);
                    const hasDetails = log.details && Object.keys(log.details).length > 0;

                    return (
                      <Fragment key={log.id}>
                        <TableRow className="group">
                          <TableCell>
                            {hasDetails && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => toggleRowExpand(log.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{formatDate(log.createdAt)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(log.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div>
                                <span className="font-medium text-sm">{log.user.name}</span>
                                <p className="text-xs text-muted-foreground">{log.user.email}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">System</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
                              <ActionIcon className="mr-1 h-3 w-3" />
                              {log.action.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.entityType ? (
                              <div className="flex flex-col gap-1">
                                <Badge
                                  className={entityTypeColors[log.entityType] || 'bg-gray-100 text-gray-800'}
                                  variant="secondary"
                                >
                                  {log.entityType.replace('_', ' ')}
                                </Badge>
                                {log.entityId && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {log.entityId.slice(0, 8)}...
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {log.details ? (
                              <div className="text-sm text-muted-foreground truncate">
                                {Object.keys(log.details).slice(0, 3).join(', ')}
                                {Object.keys(log.details).length > 3 && '...'}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {hasDetails && isExpanded && (
                          <tr className="bg-muted/30">
                            <td colSpan={7} className="p-4">
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(log.details || {}).slice(0, 9).map(([key, value]) => (
                                  <div key={key} className="text-sm">
                                    <span className="font-medium text-muted-foreground">{key}:</span>{' '}
                                    <span className="break-all">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {Object.keys(log.details || {}).length > 9 && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="mt-2 p-0"
                                  onClick={() => setSelectedLog(log)}
                                >
                                  View all {Object.keys(log.details || {}).length} fields
                                </Button>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
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

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this audit event
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              {/* Overview */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Action</p>
                  <Badge className={actionColors[selectedLog.action] || 'bg-gray-100 text-gray-800'}>
                    {selectedLog.action.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Entity Type</p>
                  {selectedLog.entityType ? (
                    <Badge className={entityTypeColors[selectedLog.entityType] || 'bg-gray-100 text-gray-800'}>
                      {selectedLog.entityType.replace('_', ' ')}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Entity ID</p>
                  <p className="font-mono text-sm break-all">{selectedLog.entityId || '-'}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Information
                </h3>
                {selectedLog.user ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedLog.user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedLog.user.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">System-generated event</p>
                )}
              </div>

              {/* Network Info */}
              {(selectedLog.ipAddress || selectedLog.userAgent) && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Network Information
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedLog.ipAddress && (
                      <div>
                        <p className="text-sm text-muted-foreground">IP Address</p>
                        <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                      </div>
                    )}
                    {selectedLog.userAgent && (
                      <div className="sm:col-span-2">
                        <p className="text-sm text-muted-foreground">User Agent</p>
                        <p className="text-sm break-all">{selectedLog.userAgent}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Details */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Change Details
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-4 overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
