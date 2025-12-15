import { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../services/audit.service.js';
import {
  createApplicationSchema,
  updateApplicationSchema,
  applicationQuerySchema,
} from '@avdmanager/shared';

export async function applicationsRoutes(app: FastifyInstance) {
  // List applications with filtering and pagination
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const result = applicationQuerySchema.safeParse(request.query);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const { page, pageSize, search, category, isMsixAppAttach, licenseRequired, isActive } = result.data;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (isMsixAppAttach !== undefined) where.isMsixAppAttach = isMsixAppAttach;
    if (licenseRequired !== undefined) where.licenseRequired = licenseRequired;
    if (isActive !== undefined) where.isActive = isActive;

    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { displayName: 'asc' },
        include: {
          _count: { select: { templates: true } },
        },
      }),
      prisma.application.count({ where }),
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

  // Get single application
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        _count: { select: { templates: true } },
      },
    });

    if (!application) {
      return reply.status(404).send({
        success: false,
        error: 'Application not found',
      });
    }

    return reply.send({
      success: true,
      data: application,
    });
  });

  // Get templates using this application
  app.get('/:id/templates', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const templates = await prisma.templateApplication.findMany({
      where: { applicationId: id },
      include: {
        template: {
          include: {
            businessUnit: { select: { name: true, code: true } },
          },
        },
      },
    });

    return reply.send({
      success: true,
      data: templates.map(ta => ta.template),
    });
  });

  // Create application
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const result = createApplicationSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    // Check for duplicate name
    const existing = await prisma.application.findUnique({
      where: { name: result.data.name },
    });

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: 'Application with this name already exists',
      });
    }

    const application = await prisma.application.create({
      data: result.data,
    });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'APPLICATION_CREATED',
      entityType: 'Application',
      entityId: application.id,
      entityName: application.displayName,
      newValue: result.data as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.status(201).send({
      success: true,
      data: application,
    });
  });

  // Update application
  app.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = updateApplicationSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Application not found',
      });
    }

    // Check for duplicate name if name is being changed
    if (result.data.name && result.data.name !== existing.name) {
      const duplicate = await prisma.application.findUnique({
        where: { name: result.data.name },
      });
      if (duplicate) {
        return reply.status(409).send({
          success: false,
          error: 'Application with this name already exists',
        });
      }
    }

    const application = await prisma.application.update({
      where: { id },
      data: result.data,
    });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'APPLICATION_UPDATED',
      entityType: 'Application',
      entityId: application.id,
      entityName: application.displayName,
      oldValue: existing as any,
      newValue: result.data as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: application,
    });
  });

  // Delete application
  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.application.findUnique({
      where: { id },
      include: { _count: { select: { templates: true } } },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Application not found',
      });
    }

    // Check if used by templates
    if (existing._count.templates > 0) {
      return reply.status(409).send({
        success: false,
        error: `Cannot delete application - it is used by ${existing._count.templates} template(s)`,
      });
    }

    await prisma.application.delete({ where: { id } });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'APPLICATION_DELETED',
      entityType: 'Application',
      entityId: id,
      entityName: existing.displayName,
      oldValue: existing as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      message: 'Application deleted successfully',
    });
  });

  // Get application categories
  app.get('/meta/categories', { preHandler: [authenticate] }, async (request, reply) => {
    const categories = await prisma.application.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { category: { not: null } },
    });

    return reply.send({
      success: true,
      data: categories
        .filter(c => c.category)
        .map(c => ({ category: c.category, count: c._count.id })),
    });
  });
}
