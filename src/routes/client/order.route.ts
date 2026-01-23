import { Router } from 'express';
import orderController from '../../controllers/client/order.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { ClientCreateOrderSchema, ClientUpdateOrderSchema } from '../../types/order/order';
import { checkStockMiddleware } from '../../middlewares/client/checkStock.middleware';

const router = Router();

router.use(authenticateMiddlewareClient);

router.post(
    '/',
    validateBody(ClientCreateOrderSchema),
    checkStockMiddleware,
    orderController.createOrder
);

router.get('/', orderController.getOrders);
router.get('/:orderCode', orderController.getOrderDetail);
router.patch(
    '/:orderCode',
    validateBody(ClientUpdateOrderSchema),
    orderController.updateOrder
);
export default router;
