import { z } from 'zod';

export const MarkNotificationAsReadSchema = z.object({
    notificationId: z.string().min(1, 'Notification ID is required'),
});

export type MarkNotificationAsRead = z.infer<typeof MarkNotificationAsReadSchema>;
