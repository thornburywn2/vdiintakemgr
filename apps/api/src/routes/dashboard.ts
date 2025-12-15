import { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';

export async function dashboardRoutes(app: FastifyInstance) {
  // Get dashboard statistics
  app.get('/stats', { preHandler: [authenticate] }, async (request, reply) => {
    const [
      total,
      draft,
      inReview,
      approved,
      deployed,
      deprecated,
      totalApplications,
      totalBusinessUnits,
    ] = await Promise.all([
      prisma.template.count(),
      prisma.template.count({ where: { status: 'DRAFT' } }),
      prisma.template.count({ where: { status: 'IN_REVIEW' } }),
      prisma.template.count({ where: { status: 'APPROVED' } }),
      prisma.template.count({ where: { status: 'DEPLOYED' } }),
      prisma.template.count({ where: { status: 'DEPRECATED' } }),
      prisma.application.count({ where: { isActive: true } }),
      prisma.businessUnit.count({ where: { isActive: true } }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        draft,
        inReview,
        approved,
        deployed,
        deprecated,
        totalApplications,
        totalBusinessUnits,
      },
    });
  });

  // Get recent activity
  app.get('/recent', { preHandler: [authenticate] }, async (request, reply) => {
    const recentTemplates = await prisma.template.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        businessUnit: { select: { name: true, code: true } },
        contact: { select: { name: true } },
      },
    });

    const recentHistory = await prisma.templateHistory.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { name: true } },
      },
    });

    return reply.send({
      success: true,
      data: {
        recentTemplates,
        recentHistory,
      },
    });
  });

  // Get templates by status
  app.get('/by-status', { preHandler: [authenticate] }, async (request, reply) => {
    const byStatus = await prisma.template.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return reply.send({
      success: true,
      data: byStatus.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
    });
  });

  // Get templates by region
  app.get('/by-region', { preHandler: [authenticate] }, async (request, reply) => {
    const templates = await prisma.template.findMany({
      select: { primaryRegion: true },
    });

    const regionCounts: Record<string, number> = {};
    templates.forEach(t => {
      regionCounts[t.primaryRegion] = (regionCounts[t.primaryRegion] || 0) + 1;
    });

    return reply.send({
      success: true,
      data: Object.entries(regionCounts).map(([region, count]) => ({
        region,
        count,
      })),
    });
  });

  // Get recent activity (audit logs) - alias for frontend compatibility
  app.get('/recent-activity', { preHandler: [authenticate] }, async (request, reply) => {
    const recentActivity = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    return reply.send({
      success: true,
      data: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
        user: log.admin ? { name: log.admin.name } : null,
      })),
    });
  });

  // Get templates by business unit
  app.get('/by-business-unit', { preHandler: [authenticate] }, async (request, reply) => {
    const byBU = await prisma.template.groupBy({
      by: ['businessUnitId'],
      _count: { id: true },
    });

    const businessUnits = await prisma.businessUnit.findMany({
      where: { id: { in: byBU.map(b => b.businessUnitId) } },
      select: { id: true, name: true, code: true },
    });

    const buMap = new Map(businessUnits.map(bu => [bu.id, bu]));

    return reply.send({
      success: true,
      data: byBU.map(item => ({
        businessUnit: buMap.get(item.businessUnitId),
        count: item._count.id,
      })),
    });
  });
}
