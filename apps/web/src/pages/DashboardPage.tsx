import { useQuery } from '@tanstack/react-query';
import { Layers, AppWindow, Building2, CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { dashboardApi } from '../services/api';
import { formatDateTime, getStatusColor } from '../lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: dashboardApi.getRecentActivity,
  });

  const statCards = [
    {
      title: 'Total Templates',
      value: stats?.totalTemplates ?? 0,
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Templates',
      value: stats?.activeTemplates ?? 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Applications',
      value: stats?.totalApplications ?? 0,
      icon: AppWindow,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Business Units',
      value: stats?.totalBusinessUnits ?? 0,
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">AVD Template Management Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? (
                  <div className="h-9 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  card.value
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Distribution & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Templates by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Templates by Status</CardTitle>
            <CardDescription>Distribution across workflow stages</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-2 flex-1 animate-pulse rounded-full bg-muted" />
                    <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.templatesByStatus?.map((item) => {
                  const total = stats.totalTemplates || 1;
                  const percentage = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.status} className="flex items-center gap-3">
                      <Badge className={getStatusColor(item.status)} variant="secondary">
                        {item.status.replace('_', ' ')}
                      </Badge>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  );
                })}
                {(!stats?.templatesByStatus || stats.templatesByStatus.length === 0) && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    No templates yet
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest changes and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {activity.action === 'CREATE' ? (
                        <FileText className="h-4 w-4 text-primary" />
                      ) : activity.action === 'UPDATE' ? (
                        <Clock className="h-4 w-4 text-primary" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user?.name || 'System'}</span>{' '}
                        {activity.action?.toLowerCase() || 'performed'}d {activity.entityType ? `a ${activity.entityType.toLowerCase()}` : 'an action'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!recentActivity || recentActivity.length === 0) && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    No recent activity
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Templates by Environment */}
      <Card>
        <CardHeader>
          <CardTitle>Templates by Environment</CardTitle>
          <CardDescription>Distribution across deployment environments</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-8">
              {stats?.templatesByEnvironment?.map((item) => (
                <div key={item.environment} className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      item.environment === 'PRODUCTION'
                        ? 'bg-green-500'
                        : item.environment === 'STAGING'
                        ? 'bg-orange-500'
                        : 'bg-purple-500'
                    }`}
                  />
                  <span className="text-sm font-medium">{item.environment}</span>
                  <span className="text-sm text-muted-foreground">({item.count})</span>
                </div>
              ))}
              {(!stats?.templatesByEnvironment || stats.templatesByEnvironment.length === 0) && (
                <span className="text-muted-foreground">No environment data available</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
