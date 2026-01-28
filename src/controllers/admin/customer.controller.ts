import { NextFunction, Request, Response } from 'express';
import customerService from '../../services/admin/customer.service';
import { ApiResponse } from '../../utils/api-response';

class CustomerController {
    getCustomers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page
                ? parseInt(req.query.page as string)
                : 1;
            const limit = req.query.limit
                ? parseInt(req.query.limit as string)
                : 10;
            const search = (req.query.search as string) || '';

            const data = await customerService.getCustomers({
                page,
                limit,
                search,
            });
            res.json(
                ApiResponse.success('Get customer list successfully', data)
            );
        } catch (error) {
            next(error);
        }
    };

    getCustomerById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const id = req.params.id as string;
            const customer = await customerService.getCustomerById(id);

            if (!customer) {
                // Assuming global error handler handles errors, or use ApiResponse.error if available
                return next(new Error('Customer not found'));
            }

            res.json(
                ApiResponse.success(
                    'Get customer detail successfully',
                    customer
                )
            );
        } catch (error) {
            next(error);
        }
    };
}

export default new CustomerController();
