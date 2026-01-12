export class JwtError extends Error {
    constructor(
        message: string,
        public statusCode: number = 401,
        public code: string = 'JWT_ERROR'
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Token đã hết hạn
 */
export class TokenExpiredError extends JwtError {
    constructor(message: string = 'Token has expired') {
        super(message, 401, 'TOKEN_EXPIRED');
    }
}
/**
 * Token không hợp lệ (signature sai, format sai)
 */
export class TokenInvalidError extends JwtError {
    constructor(message: string = 'Token is invalid') {
        super(message, 401, 'TOKEN_INVALID');
    }
}
/**
 * Không tìm thấy token
 */
export class TokenMissingError extends JwtError {
    constructor(message: string = 'Token is missing') {
        super(message, 401, 'TOKEN_MISSING');
    }
}
/**
 * Refresh token không hợp lệ
 */
export class RefreshTokenInvalidError extends JwtError {
    constructor(message: string = 'Refresh token is invalid') {
        super(message, 401, 'REFRESH_TOKEN_INVALID');
    }
}
