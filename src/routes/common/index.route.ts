import { Router } from 'express';
import productRoute from './product.route';
import categoryRoute from './category.route';
import uploadRouter from './upload.route';
const router = Router();

router.use('/product', productRoute);
router.use('/categories', categoryRoute);
router.use('/upload', uploadRouter);
export default router;
