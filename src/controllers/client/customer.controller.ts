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

    addCustomerAddress = async (req: Request, res: Response) => {
        await customerService.addCustomerAddress(req.customer!, req.body);
        res.json(ApiResponse.success('Add address successfully', null));
    };

    getCustomerAddresses = async (req: Request, res: Response) => {
        const addresses = await customerService.getCustomerAddresses(req.customer!);
        res.json(ApiResponse.success('Get addresses successfully', { addresses }));
    };

    getCustomerAddressDefault = async (req: Request, res: Response) => {
        const address = await customerService.getCustomerAddressDefault(req.customer!);
        res.json(ApiResponse.success('Get default address successfully', { address }));
    };

    resetAddressDefault = async (req: Request, res: Response) => {
        await customerService.resetAddressDefault(req.customer!, req.params.id as string);
        res.json(ApiResponse.success('Reset default address successfully', null));
    };

    removeCustomerAddress = async (req: Request, res: Response) => {
        await customerService.removeCustomerAddress(req.customer!, req.params.id as string);
        res.json(ApiResponse.success('Remove address successfully', null));
    };

    addCustomerPrescription = async (req: Request, res: Response) => {};
}

export default new CustomerController();
