import { notificationRepository } from '../../repositories/notification/notification.repository';
import { NotificationListQuery } from '../../types/notification/notification.query';
import { NotFoundRequestError, BadRequestError } from '../../errors/apiError/api-error';
import { FilterQuery } from 'mongoose';
import { INotification } from '../../models/notification/notification.model';
import { formatDateToString } from '../../utils/formatter';

class NotificationService {
    async getNotifications(staffId: string, query: NotificationListQuery) {
        const { page, limit, sortBy, sortOrder, isRead } = query;

        const filter: FilterQuery<INotification> = {};

        if (isRead !== undefined) {
            if (isRead === 'true') {
                filter.readBy = { $in: [staffId] };
            } else if (isRead === 'false') {
                filter.readBy = { $nin: [staffId] };
            }
        }

        const result = await notificationRepository.findByStaffId(staffId, filter, {
            page,
            limit,
            sortBy,
            sortOrder,
        });

        const notifications = result.data.map((notification) => ({
            _id: notification._id.toString(),
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: notification.readBy.includes(staffId),
            metadata: notification.metadata,
            createdAt: formatDateToString(notification.createdAt),
        }));

        return {
            notifications,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
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
