import { Request, Response } from 'express';
import {
    LoginCustomerDTO,
    RegisterCustomerDTO,
} from '../../types/auth/client/auth';
import authService from '../../services/client/auth.service';
import { ApiResponse } from '../../utils/api-response';
import { config } from '../../config/env.config';

class AuthController {
    registerCustomerAccount = async (req: Request, res: Response) => {
        const body = req.body as RegisterCustomerDTO;
        await authService.registerCustomer(body);
        res.json(ApiResponse.success('Register successfully', {}));
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
        res.json(ApiResponse.success('Logout successfully', {}));
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
}

export default new AuthController();
