"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenInvalidError = exports.TokenMissingError = exports.TokenInvalidError = exports.TokenExpiredError = exports.JwtError = void 0;
class JwtError extends Error {
    constructor(message, statusCode = 401, code = 'JWT_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.JwtError = JwtError;
/**
 * Token đã hết hạn
 */
class TokenExpiredError extends JwtError {
    constructor(message = 'Token has expired') {
        super(message, 401, 'TOKEN_EXPIRED');
    }
}
exports.TokenExpiredError = TokenExpiredError;
/**
 * Token không hợp lệ (signature sai, format sai)
 */
class TokenInvalidError extends JwtError {
    constructor(message = 'Token is invalid') {
        super(message, 401, 'TOKEN_INVALID');
    }
}
exports.TokenInvalidError = TokenInvalidError;
/**
 * Không tìm thấy token
 */
class TokenMissingError extends JwtError {
    constructor(message = 'Token is missing') {
        super(message, 401, 'TOKEN_MISSING');
    }
}
exports.TokenMissingError = TokenMissingError;
/**
 * Refresh token không hợp lệ
 */
class RefreshTokenInvalidError extends JwtError {
    constructor(message = 'Refresh token is invalid') {
        super(message, 401, 'REFRESH_TOKEN_INVALID');
    }
}
exports.RefreshTokenInvalidError = RefreshTokenInvalidError;
