import { Request, Response } from 'express';
import { LoginBodyDTO } from '../../types/auth/admin/auth';
import authService from '../../services/admin/auth.service';
import { ApiResponse } from '../../utils/api-response';
import { authMessage } from '../../config/constants/response-messages/auth.constant';
import { config } from '../../config/env.config';
class AuthController {
    login = async (req: Request, res: Response) => {
        const body = req.body as LoginBodyDTO;
        const deviceId = req.headers['x-device-id'];
        const data = await authService.login(body, deviceId);
        res.cookie('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: config.jwt.refreshExpiresInSecond * 1000,
            path: '/api/v1/admin',
        });
        res.json(
            ApiResponse.success(authMessage.success.login, {
                accessToken: data.accessToken,
            })
        );
    };
    logout = async (req: Request, res: Response) => {
        // lấy accessToken (đã kiểm tra ở middleware)
        const accessToken = req.headers.authorization!.split(' ')[1];
        // lấy refreshToken (đã kiểm tra ở middleware)
        const refreshToken = req.cookies.refreshToken as string;
        const adminAccount = req.adminAccount!.id;
        await authService.logout(adminAccount, accessToken, refreshToken);
        // xóa refreshToken lưu trong cookie
        res.clearCookie('refreshToken');
        res.json(ApiResponse.success('Logout successfully', null));
    };
    refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
        // lấy deviceId (đã kiểm tra ở middleware)
        const deviceId = req.headers['x-device-id'] as string;
        // lấy refreshToken (đã kiểm tra ở middleware)
        const refreshToken = req.cookies.refreshToken as string;
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
