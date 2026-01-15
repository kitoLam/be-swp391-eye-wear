import { Router } from "express";
import authController from "../../controllers/client/auth.controller";
import { LoginCustomerSchema, RegisterCustomerSchema } from "../../types/auth/client/auth";
import { validateBody } from "../../middlewares/share/validator.middleware";
import { authenticateMiddlewareClient, verifyRefreshTokenMiddlewareClient } from "../../middlewares/client/auth.middleware";

const router = Router();
router.post('/register', validateBody(RegisterCustomerSchema), authController.registerCustomerAccount);
router.post('/login', validateBody(LoginCustomerSchema), authController.login);
router.post('/logout', authenticateMiddlewareClient, authController.logout);
router.post('/refresh-token', verifyRefreshTokenMiddlewareClient, authController.refreshAccessToken);
export default router;
