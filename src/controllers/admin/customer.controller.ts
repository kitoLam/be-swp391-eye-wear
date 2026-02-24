import { Request, Response } from 'express';
import customerService from '../../services/admin/customer.service';
import { ApiResponse } from '../../utils/api-response';
import { CustomerListQuery } from '../../types/customer/customer.query';
import { CreateCustomer, UpdateCustomer } from '../../types/customer/customer';

class CustomerController {
    getList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as CustomerListQuery;
        const result = await customerService.getList(query);
        res.json(ApiResponse.success('Get customer list successfully', result));
    };

    getDetail = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const result = await customerService.getDetail(id);
        res.json(
            ApiResponse.success('Get customer detail successfully', result)
        );
    };

    create = async (req: Request, res: Response) => {
        const body = req.validatedBody as CreateCustomer;
        const result = await customerService.create(body);
        res.json(ApiResponse.success('Create customer successfully', result));
    };

    update = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const body = req.validatedBody as UpdateCustomer;
        const result = await customerService.update(id, body);
        res.json(ApiResponse.success('Update customer successfully', result));
    };

    delete = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await customerService.softDelete(id);
        res.json(ApiResponse.success('Delete customer successfully', null));
    };
}

export default new CustomerController();
