import { LoginBodyDTO } from '../../types/auth/admin/auth';
import {
    BadRequestError,
    NotFoundRequestError,
    UnauthorizedRequestError,
} from '../../errors/apiError/api-error';
import { comparePassword } from '../../utils/bcrypt.util';
import tokenService from '../token.service';
import * as jwtUtil from '../../utils/jwt.util';
import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
class AuthService {
    login = async (
        user: LoginBodyDTO,
        deviceId: string | string[] | undefined
    ) => {
        // check deviceId
        if (!deviceId || typeof deviceId != 'string') {
            throw new BadRequestError('DeviceId is invalid');
        }
        // check email exist
        const foundUser = await adminAccountRepository.findOne({
            email: user.email,
            deletedAt: null,
        });
        if (!foundUser) {
            throw new UnauthorizedRequestError('Email is wrong');
        }
        const isPasswordEqual = comparePassword(
            user.password,
            foundUser.hashedPassword
        );
        if (!isPasswordEqual) {
            throw new UnauthorizedRequestError('Password is not match');
        }
        // generate accessToken and RefreshToken
        const userId = foundUser._id.toString();
        const role = foundUser.role;
        const accessToken = tokenService.getNewAccessToken(userId, role);
        const refreshToken = await tokenService.getNewRefreshToken(
            { userId, role },
            deviceId,
            'admin'
        );
        // Return accessToken and refreshToken (refreshToken for cookie, not response)
        const dataFinal = {
            accessToken: accessToken,
            refreshToken: refreshToken, // For controller to set cookie
        };
        return dataFinal;
    };
    /**
     * Hàm giúp xác thực user hợp lệ để vào các route sau
     * @param token
     * @returns
     */
    verifyUserByAccessToken = async (
        token: string
    ): Promise<{ userId: string }> => {
        // check in blacklist
        if (await tokenService.isInBlackList(token)) {
            throw new UnauthorizedRequestError(
                'You do not have permission to get resources'
            );
        }
        // decode token
        const payload = jwtUtil.verifyAccessToken(token);
        const userId = payload.userId;
        // check user exist in the system
        const foundAdmin = await adminAccountRepository.findOne({
            _id: userId,
            deletedAt: null,
        });
        if (!foundAdmin) {
            throw new NotFoundRequestError('Not found user');
        }
        return { userId: payload.userId };
    };
    /**
     * Hàm giúp kiểm tra xem user có đủ xác thực được bản thân để vào lấy token mới không
     * @param token
     * @param deviceId
     * @returns
     */
    verifyUserByRefreshToken = async (
        token: string
    ): Promise<{ userId: string }> => {
        // check token có trong db ko
        const payload = jwtUtil.verifyRefreshToken(token);
        const userId = payload.userId;
        // check user exist in the system
        const foundAdmin = await adminAccountRepository.findOne({
            _id: userId,
            deletedAt: null,
        });
        if (!foundAdmin) {
            throw new NotFoundRequestError('Not found user');
        }
        return { userId: payload.userId };
    };
    /**
     * Logic nghiệp vụ xử lí việc tạo mới accessToken cho user
     * @param userId
     * @param deviceId
     * @param refreshToken
     * @returns
     */
    refreshAccessToken = async (
        userId: string,
        deviceId: string,
        refreshToken: string
    ): Promise<string> => {
        const currentDeviceId =
            await tokenService.getDeviceIdByRefreshTokenAndUserId(
                userId,
                refreshToken,
                'admin'
            );
        if (!currentDeviceId) {
            throw new UnauthorizedRequestError(
                'You are not allowed to get resources'
            );
        }
        // RefreshToken lúc này được dùng ở 2 device chứng tỏ bị lộ
        if (deviceId != currentDeviceId) {
            // gọi service để xóa refreshToken trong hệ thống để không ai sài refreshToken này refresh lại được
            await tokenService.deleteRefreshToken(
                userId,
                refreshToken,
                'admin'
            );
            throw new UnauthorizedRequestError(
                'You are not allowed to get resources'
            );
        }
        // Get user role from database
        const foundAdmin = await adminAccountRepository.findById(userId);
        if (!foundAdmin) {
            throw new UnauthorizedRequestError(
                'You are not allowed to get resources'
            );
        }
        return tokenService.getNewAccessToken(userId, foundAdmin.role);
    };
    logout = async (
        userId: string,
        accessToken: string,
        refreshToken: string
    ) => {
        // lưu accessToken vào blackList
        await tokenService.addAccessTokenToBlackList(accessToken);
        // xóa refreshToken hiện tại
        await tokenService.deleteRefreshToken(userId, refreshToken, 'admin');
    };
}
export default new AuthService();
