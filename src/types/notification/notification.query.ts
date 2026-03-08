import { z } from 'zod';
import { NotificationType } from '../../config/enums/notification.enum';

export const NotificationListQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().catch(1),
    limit: z.coerce.number().int().positive().max(100).optional().catch(10),
    sortBy: z.enum(['createdAt', 'updatedAt']).optional().catch('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().catch('desc'),
    isRead: z.enum(['true', 'false']).optional(),
});

export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
