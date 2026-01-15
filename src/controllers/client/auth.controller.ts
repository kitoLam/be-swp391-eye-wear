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
}

export default new AuthController();