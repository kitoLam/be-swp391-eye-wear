import {
    BadRequestError,
    ConflictRequestError,
    ForbiddenRequestError,
    NotFoundRequestError,
    UnauthorizedRequestError,
} from '../../errors/apiError/api-error';
import { customerRepository } from '../../repositories/customer/customer.repository';
import {
    LoginCustomerDTO,
    RegisterCustomerDTO,
} from '../../types/auth/client/auth';
import { comparePassword, hashPassword } from '../../utils/bcrypt.util';
import tokenService from '../token.service';
import * as jwtUtil from '../../utils/jwt.util';
import { neo4jVoucherRepository } from '../../repositories/neo4j/voucher.neo4j.repository';

class AuthService {
    registerCustomer = async (payload: RegisterCustomerDTO) => {
        // 1. Check if email already exists
        const foundUser = await customerRepository.findOne({
            email: payload.email,
            deletedAt: null,
        });

        if (foundUser) {
            throw new ConflictRequestError(
                'Another user has already registered by this email!'
            );
        }

        // 2. Hash password
        const hashedPassword = hashPassword(payload.password);

        // 3. Create customer in MongoDB
        const customer = await customerRepository.create({
            ...payload,
            hashedPassword: hashedPassword,
        });

        // 4. Create user node in Neo4j
        try {
            await neo4jVoucherRepository.createUserNode(
                customer._id.toString(),
                customer.email
            );
        } catch (error) {
            console.error('Failed to create Neo4j user node:', error);
            // Log error but don't fail registration
        }
    };
    login = async (
        payload: LoginCustomerDTO,
        deviceId: string | string[] | undefined
    ) => {
        // check deviceId
        if (!deviceId || typeof deviceId != 'string') {
            throw new BadRequestError('DeviceId is invalid');
        }
        // check email exist
        const foundUser = await customerRepository.findOne({
            email: payload.email,
            deletedAt: null,
        });
        if (!foundUser) {
            throw new UnauthorizedRequestError(
                'Account is not exist in the system'
            );
        }
        const isPasswordEqual = comparePassword(
            payload.password,
            foundUser.hashedPassword
        );
        if (!isPasswordEqual) {
            throw new UnauthorizedRequestError(
                'Wrong password, please try again'
            );
        }
        if (!foundUser.isVerified) {
            throw new ForbiddenRequestError('Account is not verified');
        }
        // generate accessToken and RefreshToken
        const userId = foundUser._id.toString();
        const accessToken = tokenService.getNewAccessToken(userId);
        const refreshToken = await tokenService.getNewRefreshToken(
            { userId },
            deviceId,
            'client'
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
        // check user is exist in the system and is verify
        const foundCustomer = await customerRepository.findOne({
            _id: userId,
            deletedAt: null,
        });
        if (!foundCustomer) {
            throw new NotFoundRequestError('Not found customer');
        }
        if (foundCustomer.isVerified == false) {
            throw new ForbiddenRequestError('Please verify your account first');
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
        // check user is exist in the system and is verify
        const foundCustomer = await customerRepository.findOne({
            _id: userId,
            deletedAt: null,
        });
        if (!foundCustomer) {
            throw new NotFoundRequestError('Not found customer');
        }
        if (foundCustomer.isVerified == false) {
            throw new ForbiddenRequestError('Please verify your account first');
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
                'client'
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
                'client'
            );
            throw new UnauthorizedRequestError(
                'You are not allowed to get resources'
            );
        }
        return tokenService.getNewAccessToken(userId);
    };
    logout = async (
        userId: string,
        accessToken: string,
        refreshToken: string
    ) => {
        // lưu accessToken vào blackList
        await tokenService.addAccessTokenToBlackList(accessToken);
        // xóa refreshToken hiện tại
        await tokenService.deleteRefreshToken(userId, refreshToken, 'client');
    };
}
export default new AuthService();
