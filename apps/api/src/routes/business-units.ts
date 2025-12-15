import { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../services/audit.service.js';
import { createBusinessUnitSchema, updateBusinessUnitSchema } from '@avdmanager/shared';

export async function businessUnitsRoutes(app: FastifyInstance) {
  // List all business units
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { includeInactive, isVendor } = request.query as { includeInactive?: string; isVendor?: string };

    const where: any = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }
    if (isVendor !== undefined) {
      where.isVendor = isVendor === 'true';
    }

    const businessUnits = await prisma.businessUnit.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { templates: true, contacts: true },
        },
      },
    });

    return reply.send({
      success: true,
      data: businessUnits,
    });
  });

  // Get single business unit
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { isPrimary: 'desc' } },
        _count: { select: { templates: true } },
      },
    });

    if (!businessUnit) {
      return reply.status(404).send({
        success: false,
        error: 'Business unit not found',
      });
    }

    return reply.send({
      success: true,
      data: businessUnit,
    });
  });

  // Get contacts for business unit
  app.get('/:id/contacts', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const contacts = await prisma.contact.findMany({
      where: { businessUnitId: id },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });

    return reply.send({
      success: true,
      data: contacts,
    });
  });

  // Create business unit
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const result = createBusinessUnitSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    // Check for duplicate code
    const existingCode = await prisma.businessUnit.findUnique({
      where: { code: result.data.code },
    });
    if (existingCode) {
      return reply.status(409).send({
        success: false,
        error: 'Business unit with this code already exists',
      });
    }

    // Check for duplicate name
    const existingName = await prisma.businessUnit.findUnique({
      where: { name: result.data.name },
    });
    if (existingName) {
      return reply.status(409).send({
        success: false,
        error: 'Business unit with this name already exists',
      });
    }

    const businessUnit = await prisma.businessUnit.create({
      data: result.data,
    });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'BUSINESS_UNIT_CREATED',
      entityType: 'BusinessUnit',
      entityId: businessUnit.id,
      entityName: businessUnit.name,
      newValue: result.data as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.status(201).send({
      success: true,
      data: businessUnit,
    });
  });

  // Update business unit
  app.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = updateBusinessUnitSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const existing = await prisma.businessUnit.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Business unit not found',
      });
    }

    const businessUnit = await prisma.businessUnit.update({
      where: { id },
      data: result.data,
    });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'BUSINESS_UNIT_UPDATED',
      entityType: 'BusinessUnit',
      entityId: businessUnit.id,
      entityName: businessUnit.name,
      oldValue: existing as any,
      newValue: result.data as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: businessUnit,
    });
  });

  // Delete business unit
  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.businessUnit.findUnique({
      where: { id },
      include: { _count: { select: { templates: true } } },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Business unit not found',
      });
    }

    if (existing._count.templates > 0) {
      return reply.status(409).send({
        success: false,
        error: `Cannot delete business unit - it has ${existing._count.templates} template(s)`,
      });
    }

    await prisma.businessUnit.delete({ where: { id } });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'BUSINESS_UNIT_DELETED',
      entityType: 'BusinessUnit',
      entityId: id,
      entityName: existing.name,
      oldValue: existing as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      message: 'Business unit deleted successfully',
    });
  });
}
