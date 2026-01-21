import { Router } from 'express';
import orderController from '../../controllers/client/order.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { ClientCreateOrderSchema } from '../../types/order/order';

const router = Router();

// Require login to create order? Usually yes.
router.use(authenticateMiddlewareClient);

router.post(
    '/',
    validateBody(ClientCreateOrderSchema),
    orderController.createOrder
);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderDetail);
router.put(
    '/:id',
    validateBody(ClientCreateOrderSchema),
    orderController.updateOrder
);

export default router;
