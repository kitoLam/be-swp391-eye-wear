import { Router } from 'express';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import { validateQuery, validateBody } from '../../middlewares/share/validator.middleware';
import { NotificationListQuerySchema } from '../../types/notification/notification.query';
import { MarkNotificationAsReadSchema } from '../../types/notification/notification';
import notificationController from '../../controllers/admin/notification.controller';

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
    '/mark-as-read',
    validateBody(MarkNotificationAsReadSchema),
    notificationController.markAsRead
);

export default router;
