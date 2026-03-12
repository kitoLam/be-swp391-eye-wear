import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../errors/apiError/api-error';
import { JwtError } from '../../errors/jwt/jwt-error';
import { MulterError } from 'multer';
import { GoogleOAuthRegisterBeforeError } from '../../errors/authError/auth-error';

export const errorMiddleware = (
    err: Error | ApiError | JwtError | MulterError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error('ERROR:', err);
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    } else if (err instanceof JwtError) {
        return res.status(err.statusCode).json({
            status: false,
            message: err.message,
            code: err.code,
        });
    } else if (err instanceof MulterError) {
        return res.status(400).json({
            success: false,
            message: 'File error',
            code: err.code,
        });
    } else if (err instanceof GoogleOAuthRegisterBeforeError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
        });
    } else if(err instanceof URIError){
        return res.status(400).json({
            success: false,
            message: "Requested URI is not valid",
            code: 400,
        })
    }
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
