import { Router } from 'express';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import { validateQuery, validateBody, validateParams } from '../../middlewares/share/validator.middleware';
import { NotificationListQuerySchema } from '../../types/notification/notification.query';
import { MarkNotificationAsReadSchema } from '../../types/notification/notification';
import notificationController from '../../controllers/admin/notification.controller';
import { ObjectIdSchema } from '../../types/common/objectId';

const router = Router();

router.use(authenticateMiddleware);

router.get(
    '/',
    validateQuery(NotificationListQuerySchema),
    notificationController.getNotifications
);

router.get(
    '/unread-count',
    notificationController.countUnread
);

router.patch(
    '/:id/mark-as-read',
    validateParams(ObjectIdSchema),
    notificationController.markAsRead
);

export default router;
