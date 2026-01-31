import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
import { RoleType } from '../../config/enums/admin-account';

class StaffService {
    getAdmins = async (role?: RoleType) => {
        const filter: Record<string, unknown> = { deletedAt: null };

        if (role) {
            filter.role = role;
        }

        const admins = await adminAccountRepository.findAllNoPagination(filter);
        return admins;
    };
}

export default new StaffService();

