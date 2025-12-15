import { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog, createTemplateHistory } from '../services/audit.service.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
  updateTemplateStatusSchema,
  templateQuerySchema,
  addTemplateApplicationSchema,
  updateTemplateApplicationSchema,
  reorderApplicationsSchema,
} from '@avdmanager/shared';

export async function templatesRoutes(app: FastifyInstance) {
  // List templates with filtering and pagination
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const result = templateQuerySchema.safeParse(request.query);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const { page, pageSize, search, status, environment, businessUnitId, region, sortBy, sortOrder } = result.data;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { namingPrefix: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (environment) where.environment = environment;
    if (businessUnitId) where.businessUnitId = businessUnitId;
    if (region) where.primaryRegion = region;

    const [items, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          businessUnit: { select: { id: true, name: true, code: true } },
          contact: { select: { id: true, name: true, email: true } },
          _count: { select: { applications: true } },
        },
      }),
      prisma.template.count({ where }),
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

  // Get single template
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        businessUnit: true,
        contact: true,
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
        applications: {
          include: { application: true },
          orderBy: { installOrder: 'asc' },
        },
      },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    return reply.send({
      success: true,
      data: template,
    });
  });

  // Create template
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const result = createTemplateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const template = await prisma.template.create({
      data: {
        ...result.data,
        createdById: request.user!.userId,
      },
      include: {
        businessUnit: true,
        contact: true,
      },
    });

    await createTemplateHistory({
      templateId: template.id,
      action: 'CREATED',
      userId: request.user!.userId,
      userName: request.user!.name,
      newStatus: template.status,
    });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'TEMPLATE_CREATED',
      entityType: 'Template',
      entityId: template.id,
      entityName: template.name,
      newValue: result.data as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.status(201).send({
      success: true,
      data: template,
    });
  });

  // Update template
  app.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = updateTemplateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...result.data,
        updatedById: request.user!.userId,
      },
      include: {
        businessUnit: true,
        contact: true,
      },
    });

    await createTemplateHistory({
      templateId: template.id,
      action: 'UPDATED',
      userId: request.user!.userId,
      userName: request.user!.name,
      changes: result.data as any,
    });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'TEMPLATE_UPDATED',
      entityType: 'Template',
      entityId: template.id,
      entityName: template.name,
      oldValue: existing as any,
      newValue: result.data as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: template,
    });
  });

  // Update template status
  app.patch('/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = updateTemplateStatusSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    const { status, comment } = result.data;

    // Set date fields based on status
    const dateUpdates: any = {};
    if (status === 'APPROVED') dateUpdates.approvedDate = new Date();
    if (status === 'DEPLOYED') dateUpdates.deployedDate = new Date();
    if (status === 'DEPRECATED') dateUpdates.deprecatedDate = new Date();

    const template = await prisma.template.update({
      where: { id },
      data: {
        status,
        ...dateUpdates,
        updatedById: request.user!.userId,
      },
    });

    await createTemplateHistory({
      templateId: template.id,
      action: 'STATUS_CHANGED',
      userId: request.user!.userId,
      userName: request.user!.name,
      oldStatus: existing.status,
      newStatus: status,
      comment,
    });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'TEMPLATE_STATUS_CHANGED',
      entityType: 'Template',
      entityId: template.id,
      entityName: template.name,
      details: { oldStatus: existing.status, newStatus: status, comment },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: template,
    });
  });

  // Delete template
  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    await prisma.template.delete({ where: { id } });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'TEMPLATE_DELETED',
      entityType: 'Template',
      entityId: id,
      entityName: existing.name,
      oldValue: existing as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      message: 'Template deleted successfully',
    });
  });

  // Duplicate template
  app.post('/:id/duplicate', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.template.findUnique({
      where: { id },
      include: { applications: true },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    const { id: _id, createdAt, updatedAt, createdById, updatedById, applications, ...templateData } = existing;

    const newTemplate = await prisma.template.create({
      data: {
        ...templateData,
        name: `${existing.name} (Copy)`,
        status: 'DRAFT',
        requestDate: new Date(),
        approvedDate: null,
        deployedDate: null,
        deprecatedDate: null,
        hostPoolId: null,
        workspaceId: null,
        appGroupId: null,
        createdById: request.user!.userId,
        applications: {
          create: applications.map(app => ({
            applicationId: app.applicationId,
            versionOverride: app.versionOverride,
            installNotes: app.installNotes,
            isRequired: app.isRequired,
            installOrder: app.installOrder,
          })),
        },
      },
      include: {
        businessUnit: true,
        contact: true,
        applications: { include: { application: true } },
      },
    });

    await createTemplateHistory({
      templateId: newTemplate.id,
      action: 'CREATED',
      userId: request.user!.userId,
      userName: request.user!.name,
      newStatus: 'DRAFT',
      comment: `Duplicated from template: ${existing.name}`,
    });

    return reply.status(201).send({
      success: true,
      data: newTemplate,
    });
  });

  // Get template history
  app.get('/:id/history', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const history = await prisma.templateHistory.findMany({
      where: { templateId: id },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      success: true,
      data: history,
    });
  });

  // === Template Applications ===

  // List applications in template
  app.get('/:id/applications', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const applications = await prisma.templateApplication.findMany({
      where: { templateId: id },
      include: { application: true },
      orderBy: { installOrder: 'asc' },
    });

    return reply.send({
      success: true,
      data: applications,
    });
  });

  // Add application to template
  app.post('/:id/applications', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = addTemplateApplicationSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    // Check if already exists
    const existing = await prisma.templateApplication.findUnique({
      where: {
        templateId_applicationId: {
          templateId: id,
          applicationId: result.data.applicationId,
        },
      },
    });

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: 'Application already exists in template',
      });
    }

    const templateApp = await prisma.templateApplication.create({
      data: {
        templateId: id,
        ...result.data,
      },
      include: { application: true },
    });

    await createTemplateHistory({
      templateId: id,
      action: 'APP_ADDED',
      userId: request.user!.userId,
      userName: request.user!.name,
      changes: { applicationId: result.data.applicationId },
    });

    return reply.status(201).send({
      success: true,
      data: templateApp,
    });
  });

  // Update application in template
  app.put('/:id/applications/:appId', { preHandler: [authenticate] }, async (request, reply) => {
    const { id, appId } = request.params as { id: string; appId: string };

    const result = updateTemplateApplicationSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const templateApp = await prisma.templateApplication.update({
      where: {
        templateId_applicationId: {
          templateId: id,
          applicationId: appId,
        },
      },
      data: result.data,
      include: { application: true },
    });

    return reply.send({
      success: true,
      data: templateApp,
    });
  });

  // Remove application from template
  app.delete('/:id/applications/:appId', { preHandler: [authenticate] }, async (request, reply) => {
    const { id, appId } = request.params as { id: string; appId: string };

    await prisma.templateApplication.delete({
      where: {
        templateId_applicationId: {
          templateId: id,
          applicationId: appId,
        },
      },
    });

    await createTemplateHistory({
      templateId: id,
      action: 'APP_REMOVED',
      userId: request.user!.userId,
      userName: request.user!.name,
      changes: { applicationId: appId },
    });

    return reply.send({
      success: true,
      message: 'Application removed from template',
    });
  });

  // Reorder applications
  app.patch('/:id/applications/reorder', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = reorderApplicationsSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    // Update all in transaction
    await prisma.$transaction(
      result.data.applications.map(app =>
        prisma.templateApplication.update({
          where: {
            templateId_applicationId: {
              templateId: id,
              applicationId: app.applicationId,
            },
          },
          data: { installOrder: app.installOrder },
        })
      )
    );

    return reply.send({
      success: true,
      message: 'Applications reordered successfully',
    });
  });
}
