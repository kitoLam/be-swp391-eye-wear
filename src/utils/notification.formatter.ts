import { INotification } from '../models/notification/notification.model';
import { formatDateToString } from './formatter';

export const formatNotification = (notification: INotification, staffId: string) => ({
    _id: notification._id.toString(),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.readBy.includes(staffId),
    metadata: notification.metadata,
    createdAt: formatDateToString(notification.createdAt),
});

export const formatNotificationForSocket = (notification: INotification, staffIds: string[]) => {
    // For socket events, we format for each staff that might receive it
    // Return a generic format that can be used by any staff
    return {
        _id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: false, // Always false for new notifications
        metadata: notification.metadata,
        createdAt: formatDateToString(notification.createdAt),
    };
};
