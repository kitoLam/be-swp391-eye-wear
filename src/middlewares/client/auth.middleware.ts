import { NextFunction, Response, Request } from 'express';
import { UnauthorizedRequestError } from '../../errors/apiError/api-error';
import authService from '../../services/client/auth.service';
const authenticateMiddlewareClient = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // split Bearer token
        const authorization = req.headers.authorization?.split(' ');
        if (!authorization || authorization.length != 2) {
            throw new UnauthorizedRequestError('Please login to get resources');
        }
        const accessToken = authorization[1].trim();
        const { userId, type } = await authService.verifyUserByAccessToken(accessToken);
        if(type != 'ACCESS'){
            throw new UnauthorizedRequestError('Please use the correct token');
        }
        req.customer = {
            id: userId,
        };
        next();
    } catch (error) {
        next(error);
    }
};
export const verifyResetPasswordTokenMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // split Bearer token
        const authorization = req.headers.authorization?.split(' ');
        if (!authorization || authorization.length != 2) {
            throw new UnauthorizedRequestError('Please login to get resources');
        }
        const resetPassToken = authorization[1].trim();
        const { userId, type } = await authService.verifyUserByAccessToken(resetPassToken);
        if(type != 'RESET_PASSWORD'){
            throw new UnauthorizedRequestError('Please use the correct token');
        }
        req.customer = {
            id: userId,
        };
        next();
    } catch (error) {
        next(error);
    }
};
const verifyRefreshTokenMiddlewareClient = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // check deviceId 
        const deviceId = req.headers['x-device-id'];
        if (!deviceId || typeof deviceId != 'string') {
            throw new UnauthorizedRequestError('Invalid deviceId');
        }
        // check token and device id in headers
        const refreshToken = req.cookies.refreshTokenClient;
        if (!refreshToken) {
            throw new UnauthorizedRequestError('Invalid refresh token');
        }
        // get payload
        const { userId, type } = await authService.verifyUserByRefreshToken(refreshToken);
        if(type != 'REFRESH'){
            throw new UnauthorizedRequestError('Please use the correct token');
        }
        req.adminAccount = {
            id: userId,
        };
        next();
    } catch (error) {
        next(error);
    }
};
export { authenticateMiddlewareClient, verifyRefreshTokenMiddlewareClient };
