import { Router } from "express";
import authController from "../../controllers/client/auth.controller";
import { ForgetPasswordSchema, LoginCustomerSchema, RegisterCustomerSchema, ResetPasswordSchema, VerifyOTPSchema } from "../../types/auth/client/auth";
import { validateBody } from "../../middlewares/share/validator.middleware";
import { authenticateMiddlewareClient, verifyRefreshTokenMiddlewareClient, verifyResetPasswordTokenMiddleware } from "../../middlewares/client/auth.middleware";
import passport from "passport";

const router = Router();
router.post('/register', validateBody(RegisterCustomerSchema), authController.registerCustomerAccount);
router.post('/login', validateBody(LoginCustomerSchema), authController.login);
router.post('/logout', authenticateMiddlewareClient, authController.logout);
router.post('/refresh-token', verifyRefreshTokenMiddlewareClient, authController.refreshAccessToken);
router.post('/request-reset-password', validateBody(ForgetPasswordSchema), authController.forgotPassword);
router.post('/request-reset-password/verify-otp', validateBody(VerifyOTPSchema), authController.verifyOTP);
router.post('/reset-password', verifyResetPasswordTokenMiddleware, validateBody(ResetPasswordSchema), authController.resetPassword);
router.get('/google', (req, res, next) => {
  const state = req.query.state as string;
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state
  })(req, res, next);
});
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: 'http://localhost:3000/login',
}), authController.handleGoogleCallback);
router.post('/request-merge-account', validateBody(LoginCustomerSchema), authController.handleRequestMergeAccount);
router.post('/request-merge-account/verify-otp', validateBody(VerifyOTPSchema), authController.handleVerifyOtpForRequestMergeAccount);
export default router;
