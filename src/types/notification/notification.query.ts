import { z } from 'zod';

export const NotificationListQuerySchema = z.object({
    lastNotificationAt: z.coerce.number().optional(),
    limit: z.coerce.number().int().positive().max(100).optional().default(10).catch(10),
    isRead: z.enum(['true', 'false']).optional(),
});

export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
