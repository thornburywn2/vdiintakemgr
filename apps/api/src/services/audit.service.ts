import { prisma } from '../db/client.js';

export interface AuditLogParams {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        details: params.details,
        oldValue: params.oldValue,
        newValue: params.newValue,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't break the main operation
  }
}

export async function createTemplateHistory(params: {
  templateId: string;
  action: string;
  userId: string;
  userName?: string;
  oldStatus?: string;
  newStatus?: string;
  changes?: Record<string, unknown>;
  comment?: string;
}): Promise<void> {
  try {
    await prisma.templateHistory.create({
      data: {
        templateId: params.templateId,
        action: params.action,
        userId: params.userId,
        userName: params.userName,
        oldStatus: params.oldStatus as any,
        newStatus: params.newStatus as any,
        changes: params.changes,
        comment: params.comment,
      },
    });
  } catch (error) {
    console.error('Failed to create template history:', error);
  }
}
