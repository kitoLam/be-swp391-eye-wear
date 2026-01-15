import { Router } from 'express';
import authRouter from './auth.route';
import attributeRouter from './attribute.route';
import productRouter from './product.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/attributes', attributeRouter);
router.use('/products', productRouter);

export default router;
