import { Request, Response } from 'express';
import customerService from '../../services/admin/customer.service';
import { ApiResponse } from '../../utils/api-response';
import { CustomerListQuery } from '../../types/customer/customer.query';
import { CreateCustomer, UpdateCustomer } from '../../types/customer/customer';
import { formatDateToString } from '../../utils/formatter';

class CustomerController {
    getList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as CustomerListQuery;
        const result = await customerService.getList(query);
        const customerListFinal = result.customers.map(item => {
            return {
                "id": item._id.toHexString(),
                "name": item.name,
                "email": item.email,
                "phone": item.phone || null,
                "gender": item.gender,
                "providers": [
                    "google"
                ],
                "createdAt": formatDateToString(item.createdAt),
            }
        })
        res.json(ApiResponse.success('Get customer list successfully', {
            customers: customerListFinal,
            pagination: result.pagination
        }));
    };

    getDetail = async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const result = await customerService.getDetail(id);
        const custFinal = {
                "id": result._id.toHexString(),
                "name": result.name,
                "email": result.email,
                "phone": result.phone || null,
                "gender": result.gender,
                "providers": [
                    "google"
                ],
                "createdAt": formatDateToString(result.createdAt),
            }
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
