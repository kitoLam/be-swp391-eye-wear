export interface JwtPayload {
    userId: string;
    role?: 'SALE_STAFF' | 'OPERATION_STAFF' | 'MANAGER' | 'SYSTEM_ADMIN';
    type: 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD';
    iat?: number;
    exp?: number;
}
