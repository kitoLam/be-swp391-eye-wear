import { Router } from 'express';
import orderController from '../../controllers/client/order.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { ClientUpdateOrderSchema } from '../../types/order/order';

const router = Router();

router.use(authenticateMiddlewareClient);
router.get('/', orderController.getOrders);
router.get('/:orderCode', orderController.getOrderDetail);
router.patch(
    '/:orderCode',
    validateBody(ClientUpdateOrderSchema),
    orderController.updateOrder
);
export default router;
