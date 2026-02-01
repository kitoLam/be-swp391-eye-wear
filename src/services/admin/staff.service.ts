import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
import { RoleType } from '../../config/enums/admin-account';
import { AdminAccountCreateDTO } from '../../types/admin-account/admin-account';

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
}

export default new StaffService();

