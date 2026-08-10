import { Notification } from '../models/Notification.js';

export async function writeAdminAudit({ actorId, action, targetUserId, message, metadata = {} }) {
  return Notification.create({
    userId: targetUserId,
    type: 'admin_action',
    message,
    metadata: {
      actorId,
      action,
      ...metadata,
    },
  });
}
