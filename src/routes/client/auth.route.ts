import { Router } from "express";
import authController from "../../controllers/client/auth.controller";
import { ForgetPasswordSchema, LoginCustomerSchema, RegisterCustomerSchema, ResetPasswordSchema, VerifyOTPSchema } from "../../types/auth/client/auth";
import { validateBody } from "../../middlewares/share/validator.middleware";
import { authenticateMiddlewareClient, verifyRefreshTokenMiddlewareClient, verifyResetPasswordTokenMiddleware } from "../../middlewares/client/auth.middleware";

const router = Router();
router.post('/register', validateBody(RegisterCustomerSchema), authController.registerCustomerAccount);
router.post('/login', validateBody(LoginCustomerSchema), authController.login);
router.post('/logout', authenticateMiddlewareClient, authController.logout);
router.post('/refresh-token', verifyRefreshTokenMiddlewareClient, authController.refreshAccessToken);
router.post('/forgot-password', validateBody(ForgetPasswordSchema), authController.forgotPassword);
router.post('/verify-otp', validateBody(VerifyOTPSchema), authController.verifyOTP);
router.post('/reset-password', verifyResetPasswordTokenMiddleware, validateBody(ResetPasswordSchema), authController.resetPassword);
export default router;
