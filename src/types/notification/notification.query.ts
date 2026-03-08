import { z } from 'zod';
import { NotificationType } from '../../config/enums/notification.enum';

export const NotificationListQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1).catch(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10).catch(10),
    sortBy: z.enum(['createdAt', 'updatedAt']).optional().default('createdAt').catch('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc').catch('desc'),
    isRead: z.enum(['true', 'false']).optional(),
});

export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
