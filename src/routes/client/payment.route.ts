// import { Router } from 'express';
// import paymentController from '../../controllers/client/payment.controller';
// import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
// import { validateBody } from '../../middlewares/share/validator.middleware';
// import { CreatePaymentSchema } from '../../types/payment/payment';

// const router = Router();

// // All payment routes require authentication
// router.use(authenticateMiddlewareClient);

// // Create payment
// router.post(
//     '/',
//     validateBody(CreatePaymentSchema),
//     paymentController.createPayment
// );

// // Get payments list
// router.get('/', paymentController.getPayments);

// // Get payment detail
// router.get('/:id', paymentController.getPaymentDetail);

// export default router;
