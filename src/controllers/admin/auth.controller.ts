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
                secure: config.env == 'deployment' ? true : false,
                maxAge: config.jwt.refreshExpiresInSecond * 1000,
                sameSite: 'none',
            });
        res.json(
            ApiResponse.success(authMessage.success.login, {
                accessToken: data.accessToken,
            })
        );
    };
}
export default new AuthController();
