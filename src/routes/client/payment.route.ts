import { Router } from 'express';
import paymentController from '../../controllers/client/payment.controller';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { CreatePaymentSchema } from '../../types/payment/payment';

const router = Router();
// api này do vnpay gọi tự động sau khi xử lí xong, ko auth
// router.get(
//     '/vnpay/result-callback',
//     paymentController.handlePaymentWithVnPayResult
// );
router.post('/zalopay/result-callback', paymentController.handleZalopayResultCallback);
// Create payment
// router.get(
//     '/vnpay/url/:orderCode/:paymentId',
//     paymentController.getVnpayPaymentUrl
// );
router.get('/zalopay/url/:invoiceId/:paymentId', authenticateMiddlewareClient, paymentController.getZaloPaymentUrl);
// router.post('/zalopay/result-callback', orderController.checkoutZaloCallback);
export default router;
