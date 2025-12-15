import { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';
import { auditLogQuerySchema } from '@avdmanager/shared';

export async function auditRoutes(app: FastifyInstance) {
  // List audit logs with filtering
  app.get('/logs', { preHandler: [authenticate] }, async (request, reply) => {
    const result = auditLogQuerySchema.safeParse(request.query);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const { page, pageSize, action, entityType, entityId, adminId, startDate, endDate } = result.data;

    const where: any = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (adminId) where.adminId = adminId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  });

  // Get logs for specific entity
  app.get('/logs/:entityType/:entityId', { preHandler: [authenticate] }, async (request, reply) => {
    const { entityType, entityId } = request.params as { entityType: string; entityId: string };

    const logs = await prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    return reply.send({
      success: true,
      data: logs,
    });
  });

  // Get unique actions for filtering
  app.get('/actions', { preHandler: [authenticate] }, async (request, reply) => {
    const actions = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: { id: true },
      orderBy: { action: 'asc' },
    });

    return reply.send({
      success: true,
      data: actions.map(a => ({ action: a.action, count: a._count.id })),
    });
  });

  // Get unique entity types for filtering
  app.get('/entity-types', { preHandler: [authenticate] }, async (request, reply) => {
    const types = await prisma.auditLog.groupBy({
      by: ['entityType'],
      _count: { id: true },
      where: { entityType: { not: null } },
    });

    return reply.send({
      success: true,
      data: types
        .filter(t => t.entityType)
        .map(t => ({ entityType: t.entityType, count: t._count.id })),
    });
  });
}
