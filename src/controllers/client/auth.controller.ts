import { Request, Response } from 'express';
import {
    ForgetPasswordDTO,
    LoginCustomerDTO,
    RegisterCustomerDTO,
    ResetPassword,
    VerifyOTP,
} from '../../types/auth/client/auth';
import authService from '../../services/client/auth.service';
import { ApiResponse } from '../../utils/api-response';
import { config } from '../../config/env.config';

class AuthController {
    registerCustomerAccount = async (req: Request, res: Response) => {
        const body = req.body as RegisterCustomerDTO;
        await authService.registerCustomer(body);
        res.json(ApiResponse.success('Register successfully', null));
    };
    login = async (req: Request, res: Response) => {
        const body = req.body as LoginCustomerDTO;
        const deviceId = req.headers['x-device-id'];
        const tokenPair = await authService.login(body, deviceId);
        res.cookie('refreshTokenClient', tokenPair.refreshToken, {
            httpOnly: true,
            secure: config.env == 'deployment' ? true : false,
            maxAge: config.jwt.refreshExpiresInSecond * 1000,
            sameSite: 'none',
        });
        res.json(
            ApiResponse.success('Login successfully', {
                accessToken: tokenPair.accessToken,
            })
        );
    };
    logout = async (req: Request, res: Response) => {
        // lấy accessToken (đã kiểm tra ở middleware)
        const accessToken = req.headers.authorization!.split(' ')[1];
        // lấy refreshToken (đã kiểm tra ở middleware)
        const refreshToken = req.cookies.refreshTokenClient as string;
        const customerId = req.customer!.id;
        await authService.logout(customerId, accessToken, refreshToken);
        // xóa refreshToken lưu trong cookie
        res.clearCookie('refreshTokenClient');
        res.json(ApiResponse.success('Logout successfully', null));
    };
    refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
        // lấy deviceId (đã kiểm tra ở middleware)
        const deviceId = req.headers['x-device-id'] as string;
        // lấy refreshToken (đã kiểm tra ở middleware)
        const refreshToken = req.cookies.refreshTokenClient as string;
        const userId = req.adminAccount!.id;
        const token = await authService.refreshAccessToken(
            userId,
            deviceId,
            refreshToken
        );
        const dataFinal = {
            accessToken: token,
        };
        res.json(
            ApiResponse.success('Get new refresh token successfully', dataFinal)
        );
    };

    forgotPassword = async (req: Request, res: Response) => {
        const body = req.body as ForgetPasswordDTO;
        await authService.forgotPassword(body.email);
        res.json(ApiResponse.success('Send OTP to mail success', null));
    };
    verifyOTP = async (req: Request, res: Response) => {
        const body = req.body as VerifyOTP;
        const resetPasswordToken = await authService.verifyOTP(body.email, body.otp);
        res.json(ApiResponse.success('Verify OTP success', {
            resetPasswordToken: resetPasswordToken,
        }));
    };
    resetPassword = async (req: Request, res: Response) => {
        const body = req.body as ResetPassword;
        await authService.resetPassword(req.customer!, body.password);
        res.json(ApiResponse.success('Reset password success', null));
    };
    handleGoogleCallback = async (req: Request, res: Response) => {
        const deviceId =  req.query.state as string;
        const tokenPair = await authService.loginWithGoogle(req.user as any, deviceId);
        res.cookie('refreshTokenClient', tokenPair.refreshToken, {
            httpOnly: true,
            secure: config.env == 'deployment' ? true : false,
            maxAge: config.jwt.refreshExpiresInSecond * 1000,
            sameSite: 'lax',
        });
        res.redirect(
            `http://localhost:5173/google/oauth/callback?accessToken=${tokenPair.accessToken}`
        );
    }
}

export default new AuthController();
