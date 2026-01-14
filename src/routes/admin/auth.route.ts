import { Router } from "express";
import { validateBody } from "../../middlewares/share/validator.middleware";
import LoginBodySchema from "../../types/auth/admin/auth";
import authController from "../../controllers/admin/auth.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.post('/login', validateBody(LoginBodySchema), authController.login);
router.post('/logout', authenticateMiddleware, authController.logout);
// router.post('/refresh-token');
export default router;
