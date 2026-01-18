import { Router } from 'express';
import authRouter from './auth.route';
import cartRouter from './cart.route';
import orderRouter from './order.route';
import invoiceRouter from './invoice.route';
import paymentRouter from './payment.route';
const router = Router();

router.use('/auth', authRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/invoices', invoiceRouter);
router.use('/payments', paymentRouter);

export default router;
