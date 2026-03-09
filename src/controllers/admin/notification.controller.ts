import { Request, Response } from 'express';
import notificationService from '../../services/admin/notification.service';
import { ApiResponse } from '../../utils/api-response';
import { NotificationListQuery } from '../../types/notification/notification.query';
import { ObjectIdDTO } from '../../types/common/objectId';

class NotificationController {
    getNotifications = async (req: Request, res: Response) => {
        const staffId = req.adminAccount!.id;
        const query = req.validatedQuery as NotificationListQuery;

        const result = await notificationService.getNotifications(staffId, query);

        res.json(
            ApiResponse.success('Get notifications successfully', result)
        );
    };

    markAsRead = async (req: Request, res: Response) => {
        const staffId = req.adminAccount!.id;
        const {id} = req.params as ObjectIdDTO;

        await notificationService.markAsRead(staffId, id);

        res.json(
            ApiResponse.success('Notification marked as read', null)
        );
    };

    countUnread = async (req: Request, res: Response) => {
        const staffId = req.adminAccount!.id;

        const result = await notificationService.countUnread(staffId);

        res.json(
            ApiResponse.success('Get unread count successfully', result)
        );
    };
}

export default new NotificationController();
