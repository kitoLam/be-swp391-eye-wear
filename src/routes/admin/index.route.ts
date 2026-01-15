import { Router } from "express";
import authRouter from './auth.route';
import attributeRouter from './attribute.route';
const router = Router();

router.use('/auth', authRouter);
router.use('/attributes', attributeRouter);
export default router;
