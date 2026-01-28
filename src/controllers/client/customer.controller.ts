import { Request, Response, NextFunction } from 'express';
import { CustomerModel } from '../../models/customer/customer.model.mongo';

import { ApiResponse } from '../../utils/api-response';

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
}

export default new CustomerController();
