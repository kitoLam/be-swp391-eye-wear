import { Request, Response } from 'express';
import staffService from '../../services/admin/staff.service';
import { ApiResponse } from '../../utils/api-response';
import { AdminAccountListQuery } from '../../types/admin-account/admin-account.query';

class StaffController {
    getAdmins = async (req: Request, res: Response) => {
        const query = req.validatedQuery as AdminAccountListQuery;
        const admins = await staffService.getAdmins(query?.role);
        res.json(
            ApiResponse.success('Get admin accounts successfully', {
                admins,
            })
        );
    };
}

export default new StaffController();

