import { Router } from 'express';
import orderController from '../../controllers/client/order.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { ClientUpdateOrderPrescriptionSchema } from '../../types/order/order.request';

const router = Router();

router.use(authenticateMiddlewareClient);
router.get('/list-by-invoice/:invoiceId', orderController.getOrderByInvoiceId);
router.get('/:orderId', orderController.getOrderDetail);
router.patch('/:orderId', validateBody(ClientUpdateOrderPrescriptionSchema), orderController.updateOrderPrescription);
export default router;
