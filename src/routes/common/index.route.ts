import { Router } from 'express';
import productRoute from './product.route';
import uploadRouter from './upload.route';
const router = Router();

router.use('/products', productRoute);
router.use('/upload', uploadRouter);
export default router;
