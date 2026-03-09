import { notificationRepository } from '../../repositories/notification/notification.repository';
import { NotificationListQuery } from '../../types/notification/notification.query';
import { NotFoundRequestError, BadRequestError } from '../../errors/apiError/api-error';
import { formatNotification } from '../../utils/notification.formatter';

class NotificationService {
    async getNotifications(staffId: string, query: NotificationListQuery) {
        const { limit, isRead, lastNotificationAt } = query;

        const notifications = await notificationRepository.findByStaffIdWithLazyLoad(staffId, {
            lastNotificationAt,
            limit,
            isRead,
        });

        const formattedNotifications = notifications.map((notification) =>
            formatNotification(notification as any, staffId)
        );

        return {
            notifications: formattedNotifications,
            pagination: {
                hasNext: notifications.length === limit,
                lastItem: notifications.length > 0
                    ? notifications[notifications.length - 1].createdAt.getTime()
                    : null,
            },
        };
    }

    async markAsRead(staffId: string, notificationId: string) {
        const notification = await notificationRepository.findById(notificationId);

        if (!notification) {
            throw new NotFoundRequestError('Notification not found');
        }

        if (!notification.allowedStaffs.includes(staffId)) {
            throw new BadRequestError('You are not allowed to access this notification');
        }

        if (notification.readBy.includes(staffId)) {
            throw new BadRequestError('Notification already marked as read');
        }

        await notificationRepository.markAsRead(notificationId, staffId);
    }

    async countUnread(staffId: string) {
        const count = await notificationRepository.countUnreadByStaffId(staffId);
        return { unreadCount: count };
    }
}

export default new NotificationService();
