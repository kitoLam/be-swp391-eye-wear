import { Request, Response, NextFunction } from 'express';
import { CustomerModel } from '../../models/customer/customer.model.mongo';

import { ApiResponse } from '../../utils/api-response';
import { UpdateCustomerProfileRequest } from '../../types/customer/customer.request';
import customerService from '../../services/client/customer.service';

class CustomerController {
    getCustomerProfile = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const customerId = req.customer?.id;
            const customer = await CustomerModel.findById(customerId).select(
                '-hashedPassword -linkedAccounts.accessToken -linkedAccounts.refreshToken'
            );

            if (!customer) {
                // Assuming global error handler handles errors, or use ApiResponse.error if available
                return next(new Error('Customer not found'));
            }

            res.json(ApiResponse.success('Get profile successfully', customer));
        } catch (error) {
            next(error);
        }
    };

    updateCustomerProfile = async (req: Request, res: Response) => {
        const body = req.body as UpdateCustomerProfileRequest;
        await customerService.updateCustomerProfile(req.customer!, body);
        res.json(ApiResponse.success('Update profile successfully', null));
    };
}

export default new CustomerController();
