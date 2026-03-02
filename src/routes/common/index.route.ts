import { Router } from 'express';
import productRoute from './product.route';
import categoryRoute from './category.route';
import uploadRouter from './upload.route';
import shipRouter from './ship.route';
const router = Router();

router.use('/products', productRoute);
router.use('/categories', categoryRoute);
router.use('/upload', uploadRouter);
router.use('/ships', shipRouter);
export default router;
