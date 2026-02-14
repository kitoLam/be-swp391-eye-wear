import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
import { RoleType } from '../../config/enums/admin-account';
import { AdminAccountCreateDTO } from '../../types/admin-account/admin-account';
import { BadRequestError, NotFoundRequestError } from '../../errors/apiError/api-error';
import { formatDateToString } from '../../utils/formatter';
import { ChangePassword } from '../../types/auth/admin/auth';
import { comparePassword, hashPassword } from '../../utils/bcrypt.util';

class StaffService {
    getAdmins = async (role?: RoleType) => {
        const filter: Record<string, unknown> = { deletedAt: null };

        if (role) {
            filter.role = role;
        }

        const admins = await adminAccountRepository.findAllNoPagination(filter);
        return admins;
    };

    createAdmin = async (payload: AdminAccountCreateDTO) => {
        const admin = await adminAccountRepository.create(payload);
        return admin;
    }

    getStaffDetail = async (adminId: string) => {
        const admin = await adminAccountRepository.findById(adminId);
        if(!admin){
            throw new NotFoundRequestError('Admin not found');
        }
        return {
            _id: admin._id.toString(),
            citizenId: admin.citizenId,
            name: admin.name,
            phone: admin.phone,
            email: admin.email,
            avatar: admin.avatar,
            role: admin.role,
            createdAt: formatDateToString(admin.createdAt),
            lastLogin: admin.lastLogin  ? formatDateToString(admin.lastLogin) : null,
        };
    }

    changePassword = async (adminId: string, payload: ChangePassword) => {
        const admin = await adminAccountRepository.findById(adminId);
        if(!admin){
            throw new NotFoundRequestError('Admin not found');
        }
        const isCurrentPasswordEqual = comparePassword(payload.currentPassword, admin.hashedPassword);
        if(!isCurrentPasswordEqual){
            throw new BadRequestError('Current password is incorrect');
        }
        const newHashedPassword = hashPassword(payload.newPassword);
        await adminAccountRepository.update(adminId, { hashedPassword: newHashedPassword });
    }
}

export default new StaffService();

