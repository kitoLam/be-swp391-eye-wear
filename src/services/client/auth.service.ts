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
import { supabase } from '../../config/supabase.config';
import { cartRepository } from '../../repositories/cart/cart.repository';
import { AuthCustomerContext } from '../../types/context/context';
import { redisPrefix } from '../../config/constants/redis.constant';
import { generateOTPCode } from '../../utils/generate.util';
import * as mailUtil from '../../utils/mail.util';
import redisService from '../redis.service';
import { config } from '../../config/env.config';
import { JwtPayload } from '../../types/jwt/jwt';
import { GoogleOAuthRegisterBeforeError } from '../../errors/authError/auth-error';

class AuthService {
    registerCustomer = async (payload: RegisterCustomerDTO) => {
        // 1. Check if email already exists
        const foundUser = await customerRepository.findOne({
            email: payload.email,
            deletedAt: null,
        });

        if (foundUser) {
            // if this user exist by register GG oauth only
            if (
                !foundUser.providers.includes('local') &&
                foundUser.providers[0] == 'google'
            ) {
                throw new GoogleOAuthRegisterBeforeError();
            }
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
            isVerified: true, // Auto verified for testing
        });

        // create cart for customer
        await cartRepository.create({
            owner: customer._id.toString(),
        });
        // 4. Create user in Supabase
        try {
            const { error } = await supabase.from('customer').insert([
                {
                    id: customer._id.toString(),
                    created_at: new Date(),
                },
            ]);

            if (error) {
                console.error('Failed to create Supabase customer:', error);
                // Log error but don't fail registration?
                // Ideally we should rollback Mongo, but for now let's just log.
            }
        } catch (error) {
            console.error('Failed to create Supabase customer:', error);
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
    loginWithGoogle = async (
        user: any,
        deviceId: string | string[] | undefined
    ) => {
        // check deviceId
        if (!deviceId || typeof deviceId != 'string') {
            throw new BadRequestError('DeviceId is invalid');
        }
        // check email exist
        const foundUser = await customerRepository.findOne({
            email: user.email,
            deletedAt: null,
        });
        if (!foundUser) {
            throw new UnauthorizedRequestError(
                'Account is not exist in the system'
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
    verifyUserByAccessToken = async (token: string): Promise<JwtPayload> => {
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
        console.log(userId);
        if (!foundCustomer) {
            throw new NotFoundRequestError('Not found customer');
        }
        if (foundCustomer.isVerified == false) {
            throw new ForbiddenRequestError('Please verify your account first');
        }
        return payload;
    };
    /**
     * Hàm giúp xác thực user cần đổi mk
     * @param token
     * @returns
     */
    verifyUserByResetPasswordToken = async (
        token: string
    ): Promise<JwtPayload> => {
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
        return payload;
    };
    /**
     * Hàm giúp kiểm tra xem user có đủ xác thực được bản thân để vào lấy token mới không
     * @param token
     * @param deviceId
     * @returns
     */
    verifyUserByRefreshToken = async (token: string): Promise<JwtPayload> => {
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
        return payload;
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

    forgotPassword = async (email: string) => {
        // Nếu gửi rồi thì override cái cũ
        const existAccount = await customerRepository.findOne({
            email: email,
            deletedAt: null,
        });
        if (!existAccount) {
            throw new NotFoundRequestError('Email is not exist in system');
        }
        const key = `${redisPrefix.mailForgotPass}:${email}`;
        const otp = generateOTPCode();
        await redisService.setDataWithExpiredTime(
            key,
            otp,
            config.otp.waitingMinute * 60
        );
        const subject = 'Reset password OTP';
        mailUtil.sendMail(
            email,
            subject,
            `<p >YOUR OTP TO RESET PASSWORD: <b>${otp}</b></p>`
        );
    };

    verifyOTP = async (email: string, otp: string) => {
        const existAccount = await customerRepository.findOne({
            email: email,
            deletedAt: null,
        });
        if (!existAccount) {
            throw new NotFoundRequestError('Email is not exist in system');
        }
        const key = `${redisPrefix.mailForgotPass}:${email}`;
        const existingOtpCode = await redisService.getDataByKey<string>(key);
        if (!existingOtpCode) {
            throw new NotFoundRequestError(
                "You don't have request to reset password"
            );
        }
        if (existingOtpCode != otp) {
            throw new BadRequestError('OTP is not correct');
        }
        await redisService.deleteDataByKey(key);
        return tokenService.getNewResetPasswordToken(
            existAccount._id.toString()
        );
    };

    resetPassword = async (
        customer: AuthCustomerContext,
        passwordRaw: string
    ) => {
        // Hash password
        const hashedPassword = hashPassword(passwordRaw);

        // Update in MongoDB
        await customerRepository.update(customer.id, {
            hashedPassword: hashedPassword,
        });
    };

    handleRequestMergeAccount = async (payload: LoginCustomerDTO) => {
        // 1. Check if email already exists
        const foundUser = await customerRepository.findOne({
            email: payload.email,
            deletedAt: null,
        });
        if (!foundUser) {
            throw new NotFoundRequestError('Not found customer');
        }
        // thằng này có account local rồi thì thôi, ko cho gửi yêu cầu
        if (foundUser) {
            if (foundUser.providers.includes('local')) {
                throw new ConflictRequestError(
                    'You have already register a manual account!'
                );
            }
        }
        const key = `${redisPrefix.mailMergeAccount}:${payload.email}`;
        const otp = generateOTPCode();
        const dataJson = {
            otp: otp,
            hashedPassword: hashPassword(payload.password),
        };
        await redisService.setDataWithExpiredTime(
            key,
            dataJson,
            config.otp.waitingMinute * 60
        );
        const subject = 'MERGE ACCOUNT OTP';
        mailUtil.sendMail(
            payload.email,
            subject,
            `<p >YOUR OTP TO MERGE ACCOUNT: <b>${otp}</b></p>`
        );
    };

    verifyOTPForRequestMergeAccount = async (email: string, otp: string) => {
        const existAccount = await customerRepository.findOne({
            email: email,
            deletedAt: null,
        });
        if (!existAccount) {
            throw new NotFoundRequestError('Email is not exist in system');
        }
        // thằng này có account local rồi thì thôi, ko cho gửi yêu cầu
        if (existAccount) {
            if (existAccount.providers.includes('local')) {
                throw new ConflictRequestError(
                    'You have already register a manual account!'
                );
            }
        }
        const key = `${redisPrefix.mailMergeAccount}:${email}`;
        const existingRequest = await redisService.getDataByKey<{
            otp: string;
            hashedPassword: string;
        }>(key);
        console.log(existingRequest);
        if (!existingRequest) {
            throw new NotFoundRequestError(
                "You don't have request to reset password"
            );
        }
        if (existingRequest.otp != otp) {
            throw new BadRequestError('OTP is not correct');
        }
        await redisService.deleteDataByKey(key);
        existAccount.hashedPassword = existingRequest.hashedPassword;
        existAccount.providers.push('local');
        await existAccount.save();
    };
}
export default new AuthService();
