import { Router } from "express";
import { validateBody } from "../../middlewares/share/validator.middleware";
import {LoginBodySchema, ChangePasswordSchema} from "../../types/auth/admin/auth";
import authController from "../../controllers/admin/auth.controller";
import { authenticateMiddleware, verifyRefreshTokenMiddleware } from "../../middlewares/admin/auth.middleware";

const router = Router();

router.post('/login', validateBody(LoginBodySchema), authController.login);
router.post('/logout', authenticateMiddleware, authController.logout);
router.post('/refresh-token', verifyRefreshTokenMiddleware, authController.refreshAccessToken);

router.get('/profile', authenticateMiddleware, authController.getProfile);
// router.post('/profile/request-update', authenticateMiddleware, authController.sendRequestUpdateProfile);
router.patch('/profile/change-password', authenticateMiddleware, validateBody(ChangePasswordSchema), authController.changePassword);
export default router;
