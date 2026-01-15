import { BadRequestError, ConflictRequestError, ForbiddenRequestError, UnauthorizedRequestError } from '../../errors/apiError/api-error';
import { customerRepository } from '../../repositories/customer/customer.repository';
import { LoginCustomerDTO, RegisterCustomerDTO } from '../../types/auth/client/auth';
import { comparePassword, hashPassword } from '../../utils/bcrypt.util';
import tokenService from '../token.service';

class AuthService {
    registerCustomer = async (payload: RegisterCustomerDTO) => {
        // check email exist
        const foundUser = await customerRepository.findOne({
            email: payload.email,
            deletedAt: null,
        });
        if (foundUser) {
            throw new ConflictRequestError(
                'Another user has already registered by this email!'
            );
        }
        // hash password
        const hashedPassword = hashPassword(payload.password);
        // create customer
        await customerRepository.create({
            ...payload,
            hashedPassword: hashedPassword,
        });
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
            throw new UnauthorizedRequestError('Account is not exist in the system');
        }
        const isPasswordEqual = comparePassword(
            payload.password,
            foundUser.hashedPassword
        );
        if (!isPasswordEqual) {
            throw new UnauthorizedRequestError('Wrong password, please try again');
        }
        if(!foundUser.isVerified) {
            throw new UnauthorizedRequestError('Account is not verified');
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
}
export default new AuthService();
