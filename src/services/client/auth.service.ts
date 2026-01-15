import { ConflictRequestError } from '../../errors/apiError/api-error';
import { customerRepository } from '../../repositories/customer/customer.repository';
import { RegisterCustomerDTO } from '../../types/auth/client/auth';
import { hashPassword } from '../../utils/bcrypt.util';

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
}
export default new AuthService();
