import { Router } from 'express';
import paymentController from '../../controllers/client/payment.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { CreatePaymentSchema } from '../../types/payment/payment';

const router = Router();

// All payment routes require authentication
router.use(authenticateMiddlewareClient);

// Create payment
router.get(
    '/vnpay/url',
    paymentController.getVnpayPaymentUrl
);
router.get(
    '/vnpay/result',
    paymentController.handlePaymentWithVnPayResult
);

export default router;
