import { redisPrefix } from '../config/constants/redis.constant';
import { RoleType } from '../config/enums/admin-account';
import { config } from '../config/env.config';
import * as jwtUtil from '../utils/jwt.util';
import redisService from './redis.service';
class TokenService {
    getNewAccessToken = (
        userId: string,
        role?: RoleType
    ) => {
        // generate accessToken from jwtUtil
        const accessToken = jwtUtil.generateAccessToken(userId, role);
        return accessToken;
    };
    getNewResetPasswordToken = (
        userId: string,
        role?: RoleType
    ) => {
        // generate token from jwtUtil
        const token = jwtUtil.generateResetPasswordToken(userId, role);
        return token;
    };
    getNewRefreshToken = async (
        payload: {
            userId: string;
            role?: RoleType,
        },
        deviceId: string,
        side: 'admin' | 'client'
    ) => {
        // generate refreshToken from jwtUtil
        const refreshToken = jwtUtil.generateRefreshToken(
            payload.userId,
            payload.role
        );
        // store refreshToken in redis
        await redisService.setDataWithExpiredTime(
            `${redisPrefix.refreshToken}:${side}:${payload.userId}:${refreshToken}`,
            deviceId,
            config.jwt.refreshExpiresInSecond
        );
        return refreshToken;
    };
    isInBlackList = async (token: string) => {
        const data = await redisService.getDataByKey<number>(
            `${redisPrefix.blacklist}:${token}`
        );
        return !(data == null);
    };
    addAccessTokenToBlackList = async (token: string) => {
        const payload = jwtUtil.verifyAccessToken(token);
        const ttlSeconds = payload.exp
            ? payload.exp - Math.floor(Date.now() / 1000)
            : 0;
        await redisService.setDataWithExpiredTime(
            `${redisPrefix.blacklist}:${token}`,
            1,
            ttlSeconds
        );
    };
    getDeviceIdByRefreshTokenAndUserId = async (
        userId: string,
        token: string,
        side: 'admin' | 'client'
    ): Promise<string | null> => {
        const deviceId = await redisService.getDataByKey<string>(
            `${redisPrefix.refreshToken}:${side}:${userId}:${token}`
        );
        return deviceId;
    };
    deleteRefreshToken = async (
        userId: string,
        token: string,
        side: 'admin' | 'client'
    ) => {
        await redisService.deleteDataByKey(
            `${redisPrefix.refreshToken}:${side}:${userId}:${token}`
        );
    };
}
export default new TokenService();
