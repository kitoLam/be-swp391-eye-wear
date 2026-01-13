import {
    CustomerModel,
    ICustomerDocument,
} from '../../models/customer/customer.model.mongo';
import { BaseRepository } from '../base.repository';

export class CustomerRepository extends BaseRepository<ICustomerDocument> {
    constructor() {
        super(CustomerModel);
    }
}

export const customerRepository = new CustomerRepository();
