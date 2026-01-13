import {
    LoginCustomer,
    RegisterCustomer,
} from '../types/customer/customer-request.dto';
import { customerRepository } from '../repositories/customer/customer.repository';
import {
    BadRequestError,
    ConflictError,
    UnauthorizedError,
    NotFoundError,
} from '../errors/apiError/api-error';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';

class AuthService {
    /**
     * Customer login
     * @param loginData - email and password
     * @param deviceId - device identifier for token management
     * @returns accessToken and refreshToken
     */
    login = async (
        loginData: LoginCustomer,
        deviceId: string | string[] | undefined
    ) => {
        // Check deviceId
        if (!deviceId || typeof deviceId !== 'string') {
            throw new BadRequestError('DeviceId is invalid');
        }

        // Check if email exists
        const foundCustomer = await customerRepository.findOne({
            email: loginData.email,
        } as any);

        if (!foundCustomer) {
            throw new UnauthorizedError('Email or password are wrong');
        }

        // Compare password
        const isPasswordEqual = await comparePassword(
            loginData.password,
            foundCustomer.hashedPassword
        );

        if (!isPasswordEqual) {
            throw new UnauthorizedError('Email or password are wrong');
        }

        // TODO: Generate accessToken and refreshToken
        const customerId = foundCustomer._id.toString();

        // Return user data (exclude password)
        const { hashedPassword, ...userWithoutPassword } =
            foundCustomer.toObject();

        const dataFinal = {
            user: userWithoutPassword,
            // accessToken: 'TODO',
            // refreshToken: 'TODO',
        };

        return dataFinal;
    };

    /**
     * Customer registration
     * @param registerData - customer registration data
     */
    register = async (registerData: RegisterCustomer) => {
        // Check if email already exists
        const foundCustomer = await customerRepository.findOne({
            email: registerData.email,
        } as any);

        if (foundCustomer) {
            throw new ConflictError(
                'Another customer has already registered with this email!'
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(registerData.password);

        // Create customer
        const newCustomer = await customerRepository.create({
            ...registerData,
            password: hashedPassword,
        } as any);

        return {
            customerId: newCustomer._id,
            email: newCustomer.email,
            name: newCustomer.name,
        };
    };

    /**
     * Verify access token
     * @param token - access token
     * @returns userId
     */
    verifyAccessToken = async (
        token: string
    ): Promise<{ customerId: string }> => {
        // TODO: Implement token blacklist check
        // if (await tokenService.isInBlackList(token)) {
        //     throw new UnauthorizedError('You do not have permission to get resources');
        // }

        // TODO: Decode and verify token
        // const payload = jwtUtil.verifyAccessToken(token);
        // const customerId = payload.customerId;

        // Temporary implementation
        const customerId = 'temp_customer_id';

        // Check if customer exists
        const customer = await customerRepository.findById(customerId);
        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        return { customerId };
    };

    /**
     * Verify refresh token
     * @param token - refresh token
     * @returns customerId
     */
    verifyRefreshToken = async (
        token: string
    ): Promise<{ customerId: string }> => {
        // TODO: Verify refresh token
        // const payload = jwtUtil.verifyRefreshToken(token);
        // const customerId = payload.customerId;

        // Temporary implementation
        const customerId = 'temp_customer_id';

        // Check if customer exists
        const customer = await customerRepository.findById(customerId);
        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        return { customerId };
    };

    /**
     * Refresh access token
     * @param customerId - customer ID
     * @param deviceId - device ID
     * @param refreshToken - current refresh token
     * @returns new accessToken
     */
    refreshAccessToken = async (
        customerId: string,
        deviceId: string,
        refreshToken: string
    ): Promise<string> => {
        // TODO: Implement refresh token validation
        // const currentDeviceId = await tokenService.getDeviceIdByRefreshTokenAndCustomerId(
        //     customerId,
        //     refreshToken
        // );

        // if (!currentDeviceId) {
        //     throw new UnauthorizedError('You are not allowed to get resources');
        // }

        // if (deviceId !== currentDeviceId) {
        //     await tokenService.deleteRefreshToken(customerId, refreshToken);
        //     throw new UnauthorizedError('You are not allowed to get resources');
        // }

        // TODO: Generate new access token
        // return tokenService.getNewAccessToken({ customerId });

        return 'new_access_token_placeholder';
    };

    /**
     * Customer logout
     * @param customerId - customer ID
     * @param accessToken - current access token
     * @param refreshToken - current refresh token
     */
    logout = async (
        customerId: string,
        accessToken: string,
        refreshToken: string
    ) => {
        // TODO: Add accessToken to blacklist
        // await tokenService.addAccessTokenToBlackList(accessToken);

        // TODO: Delete refreshToken
        // await tokenService.deleteRefreshToken(customerId, refreshToken);

        return { message: 'Logout successful' };
    };
}

export default new AuthService();
