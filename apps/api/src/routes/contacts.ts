import { FastifyInstance } from 'fastify';
import { prisma } from '../db/client.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../services/audit.service.js';
import { createContactSchema, updateContactSchema } from '@avdmanager/shared';

export async function contactsRoutes(app: FastifyInstance) {
  // List all contacts
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { businessUnitId, search, page, pageSize } = request.query as {
      businessUnitId?: string;
      search?: string;
      page?: string;
      pageSize?: string;
    };

    const where: any = {};
    if (businessUnitId) where.businessUnitId = businessUnitId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = parseInt(page || '1');
    const pageSizeNum = parseInt(pageSize || '100');
    const skip = (pageNum - 1) * pageSizeNum;

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        include: {
          businessUnit: { select: { id: true, name: true, code: true } },
          _count: { select: { templates: true } },
        },
        skip,
        take: pageSizeNum,
      }),
      prisma.contact.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        items: contacts,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  });

  // Get single contact
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        businessUnit: true,
        _count: { select: { templates: true } },
      },
    });

    if (!contact) {
      return reply.status(404).send({
        success: false,
        error: 'Contact not found',
      });
    }

    return reply.send({
      success: true,
      data: contact,
    });
  });

  // Create contact
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const result = createContactSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    // If setting as primary, unset other primaries in same business unit
    if (result.data.isPrimary) {
      await prisma.contact.updateMany({
        where: { businessUnitId: result.data.businessUnitId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.contact.create({
      data: result.data,
      include: { businessUnit: true },
    });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'CONTACT_CREATED',
      entityType: 'Contact',
      entityId: contact.id,
      entityName: contact.name,
      newValue: result.data as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.status(201).send({
      success: true,
      data: contact,
    });
  });

  // Update contact
  app.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const result = updateContactSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: result.error.flatten(),
      });
    }

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Contact not found',
      });
    }

    // If setting as primary, unset other primaries in same business unit
    if (result.data.isPrimary && !existing.isPrimary) {
      await prisma.contact.updateMany({
        where: { businessUnitId: existing.businessUnitId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: result.data,
      include: { businessUnit: true },
    });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'CONTACT_UPDATED',
      entityType: 'Contact',
      entityId: contact.id,
      entityName: contact.name,
      oldValue: existing as any,
      newValue: result.data as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      data: contact,
    });
  });

  // Delete contact
  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.contact.findUnique({
      where: { id },
      include: { _count: { select: { templates: true } } },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Contact not found',
      });
    }

    if (existing._count.templates > 0) {
      return reply.status(409).send({
        success: false,
        error: `Cannot delete contact - they are assigned to ${existing._count.templates} template(s)`,
      });
    }

    await prisma.contact.delete({ where: { id } });

    await createAuditLog({
      adminId: request.user!.userId,
      action: 'CONTACT_DELETED',
      entityType: 'Contact',
      entityId: id,
      entityName: existing.name,
      oldValue: existing as any,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      message: 'Contact deleted successfully',
    });
  });
}
