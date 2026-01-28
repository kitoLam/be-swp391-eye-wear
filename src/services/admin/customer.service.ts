import { CustomerModel } from '../../models/customer/customer.model.mongo';
import { Customer } from '../../types/customer/customer';

interface CustomerListQuery {
    page?: number;
    limit?: number;
    search?: string;
}

interface CustomerListResponse {
    items: Customer[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

class CustomerService {
    async getCustomers(
        query: CustomerListQuery
    ): Promise<CustomerListResponse> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const search = query.search;

        const filter: any = {};
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
            ];
        }

        const [items, total] = await Promise.all([
            CustomerModel.find(filter)
                .select(
                    '-hashedPassword -linkedAccounts.accessToken -linkedAccounts.refreshToken'
                )
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            CustomerModel.countDocuments(filter),
        ]);

        return {
            items,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }

    async getCustomerById(id: string): Promise<Customer | null> {
        return CustomerModel.findById(id).select(
            '-hashedPassword -linkedAccounts.accessToken -linkedAccounts.refreshToken'
        );
    }
}

export default new CustomerService();
