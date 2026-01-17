import { Router } from 'express';
import authRouter from './auth.route';
import cartRouter from './cart.route';
import orderRouter from './order.route';
const router = Router();

router.use('/auth', authRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);

export default router;
