import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';
import {
    TokenExpiredError,
    TokenInvalidError,
    RefreshTokenInvalidError,
} from '../errors/jwt/JwtError';
import { JwtPayload } from '../types/jwt/Jwt';

// generated access token
export const generateAccessToken = (userId: string, email?: string): string => {
    const payload: JwtPayload = {
        userId,
        email,
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
    email?: string
): string => {
    const payload: JwtPayload = {
        userId,
        email,
    };
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn, // VD: '30d'
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
        // Phân loại lỗi cụ thể
        if (error.name === 'TokenExpiredError') {
            throw new TokenExpiredError(
                `Access token expired at ${new Date(
                    error.expiredAt
                ).toISOString()}`
            );
        }
        if (error.name === 'JsonWebTokenError') {
            throw new TokenInvalidError(
                `Invalid access token: ${error.message}`
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
        if (error.name === 'TokenExpiredError') {
            throw new RefreshTokenInvalidError(
                `Refresh token expired at ${new Date(
                    error.expiredAt
                ).toISOString()}`
            );
        }
        if (error.name === 'JsonWebTokenError') {
            throw new RefreshTokenInvalidError(
                `Invalid refresh token: ${error.message}`
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
