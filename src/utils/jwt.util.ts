import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';
import {
    TokenExpiredError,
    TokenInvalidError,
    RefreshTokenInvalidError,
} from '../errors/jwt/jwt-error';
import { JwtPayload } from '../types/jwt/jwt';

// generated access token
export const generateAccessToken = (
    userId: string,
    role:
        | 'SALE_STAFF'
        | 'OPERATION_STAFF'
        | 'MANAGER'
        | 'SYSTEM_ADMIN' = 'SALE_STAFF'
): string => {
    const payload: JwtPayload = {
        userId,
        role,
        type: 'ACCESS',
        // JWT tự động thêm iat và exp khi sign
    };

    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn, // VD: '7d'
    } as jwt.SignOptions);
};
/**
 * =====================================================
 * GENERATE REFRESH TOKEN
 * =====================================================
 * Tạo refresh token với expiration time dài hơn
 */
export const generateRefreshToken = (
    userId: string,
    role:
        | 'SALE_STAFF'
        | 'OPERATION_STAFF'
        | 'MANAGER'
        | 'SYSTEM_ADMIN' = 'SALE_STAFF'
): string => {
    const payload: JwtPayload = {
        userId,
        role,
        type: 'REFRESH',
    };
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn, // VD: '30d'
    } as jwt.SignOptions);
};
/**
 * =====================================================
 * GENERATE RESET_PASSWORD TOKEN
 * =====================================================
 * Tạo refresh token với expiration time dài hơn
 */
export const generateResetPasswordToken = (
    userId: string,
    role:
        | 'SALE_STAFF'
        | 'OPERATION_STAFF'
        | 'MANAGER'
        | 'SYSTEM_ADMIN' = 'SALE_STAFF'
): string => {
    const payload: JwtPayload = {
        userId,
        role,
        type: 'RESET_PASSWORD',
    };
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn, // VD: '30d'
    } as jwt.SignOptions);
};
/**
 * =====================================================
 * VERIFY ACCESS TOKEN
 * =====================================================
 * Kiểm tra access token với custom errors
 */
export const verifyAccessToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        return decoded;
    } catch (error: any) {
        const jwtError = error as jwt.JsonWebTokenError;
        // Phân loại lỗi cụ thể
        if (jwtError.name === 'TokenExpiredError') {
            const tokenExpiredError = jwtError as jwt.TokenExpiredError;
            throw new TokenExpiredError(
                `Access token expired at ${new Date(
                    tokenExpiredError.expiredAt
                ).toISOString()}`
            );
        }
        if (jwtError.name === 'JsonWebTokenError') {
            throw new TokenInvalidError(
                `Invalid access token: ${jwtError.message}`
            );
        }
        // Lỗi khác
        throw new TokenInvalidError('Failed to verify access token');
    }
};
/**
 * =====================================================
 * VERIFY REFRESH TOKEN
 * =====================================================
 * Kiểm tra refresh token với custom errors
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(
            token,
            config.jwt.refreshSecret
        ) as JwtPayload;
        return decoded;
    } catch (error: any) {
        const jwtError = error as jwt.JsonWebTokenError;
        if (jwtError.name === 'TokenExpiredError') {
            const tokenExpiredError = jwtError as jwt.TokenExpiredError;
            throw new RefreshTokenInvalidError(
                `Refresh token expired at ${new Date(
                    tokenExpiredError.expiredAt
                ).toISOString()}`
            );
        }
        if (jwtError.name === 'JsonWebTokenError') {
            const jsonWebTokenError = error as jwt.JsonWebTokenError;
            throw new RefreshTokenInvalidError(
                `Invalid refresh token: ${jsonWebTokenError.message}`
            );
        }
        throw new RefreshTokenInvalidError('Failed to verify refresh token');
    }
};
/**
 * =====================================================
 * DECODE TOKEN (WITHOUT VERIFICATION)
 * =====================================================
 * Giải mã token để xem payload (bao gồm exp)
 */
export const decodeToken = (token: string): JwtPayload | null => {
    try {
        return jwt.decode(token) as JwtPayload;
    } catch (error) {
        return null;
    }
};

/**
 * =====================================================
 * CHECK IF TOKEN IS EXPIRED
 * =====================================================
 * Kiểm tra token có hết hạn không (không verify signature)
 */
export const isTokenExpired = (token: string): boolean => {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    // exp là timestamp tính bằng giây
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
};
/**
 * =====================================================
 * GET TOKEN EXPIRATION TIME
 * =====================================================
 * Lấy thời gian hết hạn của token
 */
export const getTokenExpiration = (token: string): Date | null => {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return null;
    // Chuyển từ giây sang milliseconds
    return new Date(decoded.exp * 1000);
};
