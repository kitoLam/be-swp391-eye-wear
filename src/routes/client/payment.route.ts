import { Router } from 'express';
import paymentController from '../../controllers/client/payment.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { CreatePaymentSchema } from '../../types/payment/payment';

const router = Router();
// api này do vnpay gọi tự động sau khi xử lí xong, ko auth
router.get(
    '/vnpay/result-callback',
    paymentController.handlePaymentWithVnPayResult
);
router.post(
    '/zalopay/result-callback',
    paymentController.handleZalopayResultCallback
);
router.post(
    '/payos/result-callback',
    paymentController.handlePayOsResultCallback
);
router.get(
    '/payos/cancel-result-callback',
    paymentController.handlePayOsCancelCallback
);
router.get('/vnpay/recurring', paymentController.testRecurringPayment);
router.get('/vnpay/recurring/result-callback', paymentController.handleRecurringPayment);
// Create payment
router.use(authenticateMiddlewareClient);
router.get(
    '/vnpay/url/:invoiceId/:paymentId',
    paymentController.getVnpayPaymentUrl
);
router.get(
    '/zalopay/url/:invoiceId/:paymentId',
    authenticateMiddlewareClient,
    paymentController.getZaloPaymentUrl
);
router.get(
    '/payos/url/:invoiceId/:paymentId',
    authenticateMiddlewareClient,
    paymentController.getPayosPaymentUrl
);
router.get('/:paymentId', paymentController.getPaymentDetail);

export default router;
