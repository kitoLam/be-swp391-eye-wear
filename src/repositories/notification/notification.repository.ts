import { BaseRepository } from '../base.repository';
import { INotification, NotificationModel } from '../../models/notification/notification.model';
import { FilterQuery } from 'mongoose';

export class NotificationRepository extends BaseRepository<INotification> {
    constructor() {
        super(NotificationModel);
    }

    async findByStaffId(
        staffId: string,
        filter: FilterQuery<INotification> = {},
        options: {
            page?: number;
            limit?: number;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        } = {}
    ) {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const skip = (page - 1) * limit;
        const sortObj = { [sortBy]: sortOrder };

        const finalFilter = {
            ...filter,
            allowedStaffs: { $in: [staffId] },
        } as FilterQuery<INotification>;

        const [data, total] = await Promise.all([
            this.model.find(finalFilter).skip(skip).limit(limit).sort(sortObj),
            this.model.countDocuments(finalFilter),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
        };
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
