import { FilterQuery } from 'mongoose';
import { customerRepository } from '../../repositories/customer/customer.repository';
import { ICustomerDocument } from '../../models/customer/customer.model.mongo';
import { CustomerListQuery } from '../../types/customer/customer.query';
import { CreateCustomer, UpdateCustomer } from '../../types/customer/customer';
import {
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import bcrypt from 'bcryptjs';

class CustomerService {
    async getList(query: CustomerListQuery) {
        const filter: FilterQuery<ICustomerDocument> = {
            deletedAt: null,
        };

        if (query.search) {
            const regex = new RegExp(query.search, 'gi');
            filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
        }

        if (query.gender) {
            filter.gender = query.gender;
        }

        const result = await customerRepository.find(filter, {
            page: query.page,
            limit: query.limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });

        return {
            customers: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        };
    }

    async getDetail(id: string) {
        const customer = await customerRepository.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!customer) {
            throw new NotFoundRequestError('Customer not found');
        }

        return customer;
    }

    async create(data: CreateCustomer) {
        // Check duplicate email/phone
        const orConditions: any[] = [{ email: data.email }];
        if (data.phone) {
            orConditions.push({ phone: data.phone });
        }

        const existing = await customerRepository.findOne({
            $or: orConditions,
            deletedAt: null,
        });

        if (existing) {
            throw new ConflictRequestError('Email or phone already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newCustomer = await customerRepository.create({
            ...data,
            hashedPassword,
            providers: ['local'],
        } as any);

        return newCustomer;
    }

    async update(id: string, data: UpdateCustomer) {
        const customer = await this.getDetail(id);

        if (data.email || data.phone) {
            const orConditions: any[] = [];
            if (data.email) orConditions.push({ email: data.email });
            if (data.phone) orConditions.push({ phone: data.phone });

            const existing = await customerRepository.findOne({
                _id: { $ne: id },
                $or: orConditions,
                deletedAt: null,
            });

            if (existing) {
                throw new ConflictRequestError('Email or phone already exists');
            }
        }

        const updateData: any = { ...data };
        if (data.password) {
            updateData.hashedPassword = await bcrypt.hash(data.password, 10);
            delete updateData.password;
        }

        return await customerRepository.update(id, updateData);
    }

    async softDelete(id: string) {
        await this.getDetail(id);

        return await customerRepository.update(id, {
            deletedAt: new Date(),
        } as any);
    }
}

export default new CustomerService();
