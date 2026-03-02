import { Request, Response } from 'express';
import adminAccountService from '../../services/admin/admin-account.service';
import { ApiResponse } from '../../utils/api-response';
import { AdminAccountListQuery } from '../../types/admin-account/admin-account.query';
import {
    AdminAccountCreateDTO,
    AdminAccountUpdateDTO,
} from '../../types/admin-account/admin-account.request';
import { formatDateToString } from '../../utils/formatter';

class AdminAccountController {
    getList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as AdminAccountListQuery;
        const result = await adminAccountService.getList(query);
        const listFinal = result.adminAccounts.map(item => {
            return {
                _id: item._id.toString(),
                name: item.name,
                citizenId: item.citizenId,
                phone: item.phone,
                email: item.email,
                avatar: item.avatar,
                role: item.role,
                createdAt: item.createdAt
                    ? formatDateToString(item.createdAt)
                    : null,
                lastLogin: item.lastLogin
                    ? formatDateToString(item.lastLogin)
                    : null,
            };
        });
        res.json(
            ApiResponse.success('Get list admin accounts success', {
                adminAccounts: listFinal,
                pagination: result.pagination,
            })
        );
    };

    getDetail = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const result = await adminAccountService.getDetail(id);
        res.json(
            ApiResponse.success('Get admin account detail success', {
                _id: result._id.toString(),
                name: result.name,
                citizenId: result.citizenId,
                phone: result.phone,
                email: result.email,
                avatar: result.avatar,
                role: result.role,
                createdAt: result.createdAt
                    ? formatDateToString(result.createdAt)
                    : null,
                lastLogin: result.lastLogin
                    ? formatDateToString(result.lastLogin)
                    : null,
            })
        );
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
