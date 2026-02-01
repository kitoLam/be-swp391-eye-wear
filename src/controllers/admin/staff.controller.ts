import { Request, Response } from 'express';
import staffService from '../../services/admin/staff.service';
import { ApiResponse } from '../../utils/api-response';
import { AdminAccountListQuery } from '../../types/admin-account/admin-account.query';
import { AdminAccountCreateDTO } from '../../types/admin-account/admin-account';

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

    createAdmin = async (req: Request, res: Response) => {
        await staffService.createAdmin(req.validatedBody as AdminAccountCreateDTO);
        res.json(ApiResponse.success('Create admin successfully', null));
    }
}

export default new StaffController();

