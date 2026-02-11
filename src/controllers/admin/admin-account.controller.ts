import { Request, Response } from 'express';
import adminAccountService from '../../services/admin/admin-account.service';
import { ApiResponse } from '../../utils/api-response';
import { AdminAccountListQuery } from '../../types/admin-account/admin-account.query';
import { AdminAccountCreateDTO, AdminAccountUpdateDTO } from '../../types/admin-account/admin-account.request';

class AdminAccountController {
    getList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as AdminAccountListQuery;
        const result = await adminAccountService.getList(query);
        res.json(ApiResponse.success('Get list admin accounts success', result));
    };

    getDetail = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const result = await adminAccountService.getDetail(id);
        res.json(ApiResponse.success('Get admin account detail success', result));
    };

    create = async (req: Request, res: Response) => {
        const body = req.validatedBody as AdminAccountCreateDTO;
        const result = await adminAccountService.create(body);
        res.json(ApiResponse.success('Create admin account success', result));
    };

    update = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const body = req.validatedBody as AdminAccountUpdateDTO;
        const result = await adminAccountService.update(id, body);
        res.json(ApiResponse.success('Update admin account success', result));
    };

    delete = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await adminAccountService.softDelete(id);
        res.json(ApiResponse.success('Delete admin account success', null));
    };
}

export default new AdminAccountController();

