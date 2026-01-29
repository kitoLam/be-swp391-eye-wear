export interface JwtPayload {
    userId: string;
    type: "ACCESS" | "REFRESH" | "RESET_PASSWORD";
    iat?: number;
    exp?: number;
}
