import { RoleType } from "../../config/enums/admin-account";

export interface JwtPayload {
    userId: string;
    role?: RoleType,
    type: 'ACCESS' | 'REFRESH' | 'RESET_PASSWORD';
    iat?: number;
    exp?: number;
}
