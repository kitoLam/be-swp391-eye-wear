import { Router } from "express";
import authRouter from './auth.route';
import attributeRouter from './attribute.route';
import categoryRouter from './category.route';
const router = Router();

router.use('/auth', authRouter);
router.use('/attributes', attributeRouter);
router.use('/categories', categoryRouter);
export default router;
