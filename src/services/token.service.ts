import { redisPrefix } from '../config/constants/redis.constant'; 
import { config } from '../config/env.config';
import * as jwtUtil from '../utils/jwt.util';
import redisService from './redis.service';
class TokenService {
    getNewAccessToken = (userId: string) => {
        // generate accessToken from jwtUtil
        const accessToken = jwtUtil.generateAccessToken( userId );
        return accessToken;
    };
    getNewRefreshToken = async (
        payload: { userId: string; email?: string },
        deviceId: string
    ) => {
        // generate refreshToken from jwtUtil
        const refreshToken = jwtUtil.generateRefreshToken(
            payload.userId,
        );
        // store refreshToken in redis
        await redisService.setDataWithExpiredTime(
            `${redisPrefix.refreshToken}:${payload.userId}:${refreshToken}`,
            deviceId,
            config.jwt.expiresInSecond
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
            ? (payload.exp) - Math.floor(Date.now() / 1000)
            : 0;
        await redisService.setDataWithExpiredTime(
            `${redisPrefix.blacklist}:${token}`,
            1,
            ttlSeconds
        );
    };
    getDeviceIdByRefreshTokenAndUserId = async (
        userId: string,
        token: string
    ): Promise<string | null> => {
        const deviceId = await redisService.getDataByKey<string>(
            `${redisPrefix.refreshToken}:${userId}:${token}`
        );
        return deviceId;
    };
    deleteRefreshToken = async (userId: string, token: string) => {
        await redisService.deleteDataByKey(
            `${redisPrefix.refreshToken}:${userId}:${token}`
        );
    };
}
export default new TokenService();
