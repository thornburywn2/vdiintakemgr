import { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';

export async function exportRoutes(app: FastifyInstance) {
  // Export templates as JSON
  app.get('/templates/json', { preHandler: [authenticate] }, async (request, reply) => {
    const templates = await prisma.template.findMany({
      include: {
        businessUnit: true,
        contact: true,
        applications: {
          include: { application: true },
          orderBy: { installOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="templates-${new Date().toISOString().split('T')[0]}.json"`);

    return reply.send({
      exportDate: new Date().toISOString(),
      count: templates.length,
      templates,
    });
  });

  // Export single template as JSON
  app.get('/templates/:id/json', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        businessUnit: true,
        contact: true,
        applications: {
          include: { application: true },
          orderBy: { installOrder: 'asc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    const filename = `template-${template.namingPrefix}-${new Date().toISOString().split('T')[0]}.json`;
    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);

    return reply.send({
      exportDate: new Date().toISOString(),
      template,
    });
  });

  // Export templates as CSV
  app.get('/templates/csv', { preHandler: [authenticate] }, async (request, reply) => {
    const templates = await prisma.template.findMany({
      include: {
        businessUnit: true,
        contact: true,
        _count: { select: { applications: true } },
      },
      orderBy: { name: 'asc' },
    });

    const headers = [
      'Name',
      'Status',
      'Environment',
      'Business Unit',
      'Business Unit Code',
      'Contact',
      'Contact Email',
      'Naming Prefix',
      'Host Pool Type',
      'Primary Region',
      'Regions',
      'Base OS',
      'Image Version',
      'Subscription ID',
      'Resource Group',
      'Applications Count',
      'Request Date',
      'Last Modified',
      'Approved Date',
      'Deployed Date',
    ];

    const rows = templates.map(t => [
      t.name,
      t.status,
      t.environment,
      t.businessUnit.name,
      t.businessUnit.code,
      t.contact.name,
      t.contact.email,
      t.namingPrefix,
      t.hostPoolType,
      t.primaryRegion,
      t.regions.join('; '),
      t.baseOS || '',
      t.imageVersion || '',
      t.subscriptionId || '',
      t.resourceGroup || '',
      t._count.applications.toString(),
      t.requestDate.toISOString(),
      t.lastModifiedDate.toISOString(),
      t.approvedDate?.toISOString() || '',
      t.deployedDate?.toISOString() || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="templates-${new Date().toISOString().split('T')[0]}.csv"`);

    return reply.send(csvContent);
  });

  // Export applications as CSV
  app.get('/applications/csv', { preHandler: [authenticate] }, async (request, reply) => {
    const applications = await prisma.application.findMany({
      include: {
        _count: { select: { templates: true } },
      },
      orderBy: { displayName: 'asc' },
    });

    const headers = [
      'Name',
      'Display Name',
      'Version',
      'Publisher',
      'Category',
      'MSIX App Attach',
      'License Required',
      'License Type',
      'License Vendor',
      'Templates Using',
      'Active',
    ];

    const rows = applications.map(a => [
      a.name,
      a.displayName,
      a.version || '',
      a.publisher || '',
      a.category || '',
      a.isMsixAppAttach ? 'Yes' : 'No',
      a.licenseRequired ? 'Yes' : 'No',
      a.licenseType || '',
      a.licenseVendor || '',
      a._count.templates.toString(),
      a.isActive ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.csv"`);

    return reply.send(csvContent);
  });
}
