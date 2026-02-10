export class AuthError extends Error {
    constructor(
        message: string,
        public statusCode: number = 401,
        public code: string = 'AUTH_ERROR'
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class GoogleOAuthRegisterBeforeError extends AuthError {
  constructor(message: string = 'This account has registered by Google oauth before, please use Login By Google or merge it') {
        super(message, 401, 'EXIST_GOOGLE_OAUTH_ACCOUNT');
    }
}