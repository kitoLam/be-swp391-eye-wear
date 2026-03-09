import { BaseRepository } from '../base.repository';
import { INotification, NotificationModel } from '../../models/notification/notification.model';
import { FilterQuery } from 'mongoose';

export class NotificationRepository extends BaseRepository<INotification> {
    constructor() {
        super(NotificationModel);
    }

    async findByStaffIdWithLazyLoad(
        staffId: string,
        options: {
            lastNotificationAt?: number;
            limit?: number;
            isRead?: 'true' | 'false';
        } = {}
    ) {
        const {
            lastNotificationAt,
            limit = 10,
            isRead,
        } = options;

        const filter: FilterQuery<INotification> = {
            allowedStaffs: { $in: [staffId] },
        };

        // Filter by read status
        if (isRead === 'true') {
            filter.readBy = { $in: [staffId] };
        } else if (isRead === 'false') {
            filter.readBy = { $nin: [staffId] };
        }

        // If lastNotificationAt is provided, get notifications older than that timestamp
        if (lastNotificationAt) {
            const lastNotification = await this.model.findOne({
                createdAt: lastNotificationAt,
            })
                .select('createdAt')
                .lean();

            if (lastNotification) {
                filter.createdAt = {
                    $lt: lastNotification.createdAt,
                };
            }
        }

        const notifications = await this.model
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return notifications;
    }

    async countUnreadByStaffId(staffId: string): Promise<number> {
        return await this.model.countDocuments({
            allowedStaffs: { $in: [staffId] },
            readBy: { $nin: [staffId] },
        });
    }

    async markAsRead(notificationId: string, staffId: string): Promise<INotification | null> {
        return await this.model.findByIdAndUpdate(
            notificationId,
            { $addToSet: { readBy: staffId } },
            { new: true }
        );
    }
}

export const notificationRepository = new NotificationRepository();
