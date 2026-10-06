import { prisma } from '../lib/prisma.js';

export function audit(actorId: string, action: string, entityType: string, entityId: string, details?: unknown) {
  return prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, details: details as object | undefined }
  });
}
