import { FilterQuery } from 'mongoose';
import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
import {
    AdminAccountCreateDTO,
    AdminAccountUpdateDTO,
} from '../../types/admin-account/admin-account.request';
import { AdminAccountListQuery } from '../../types/admin-account/admin-account.query';
import { IAdminAccountDocument } from '../../models/admin-account/admin-account.model.mongo';
import {
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import bcrypt from 'bcrypt';

class AdminAccountService {
    async getList(query: AdminAccountListQuery) {
        const filter: FilterQuery<IAdminAccountDocument> = {
            deletedAt: null,
        };

        if (query.search) {
            const regex = new RegExp(query.search, 'gi');
            filter.$or = [
                { name: regex },
                { email: regex },
                { phone: regex },
            ];
        }

        if (query.role) {
            filter.role = query.role;
        }

        const result = await adminAccountRepository.find(filter, {
            page: query.page,
            limit: query.limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });

        return {
            adminAccounts: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        };
    }

    async getDetail(id: string) {
        const account = await adminAccountRepository.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!account) {
            throw new NotFoundRequestError('Admin account not found');
        }

        return account;
    }

    async create(data: AdminAccountCreateDTO) {
        // Check duplicate email/phone/citizenId
        const existing = await adminAccountRepository.findOne({
            $or: [
                { email: data.email },
                { phone: data.phone },
                { citizenId: data.citizenId },
            ],
            deletedAt: null,
        });

        if (existing) {
            throw new ConflictRequestError(
                'Email, phone or citizenId already exists'
            );
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newAccount = await adminAccountRepository.create({
            ...data,
            hashedPassword,
        } as any);

        return newAccount;
    }

    async update(id: string, data: AdminAccountUpdateDTO) {
        const account = await this.getDetail(id);

        if (data.email || data.phone || data.citizenId) {
            const existing = await adminAccountRepository.findOne({
                _id: { $ne: id },
                $or: [
                    { email: data.email },
                    { phone: data.phone },
                    { citizenId: data.citizenId },
                ].filter((item) => Object.values(item)[0] !== undefined),
                deletedAt: null,
            });

            if (existing) {
                throw new ConflictRequestError(
                    'Email, phone or citizenId already exists'
                );
            }
        }

        const updateData: any = { ...data };
        if (data.password) {
            updateData.hashedPassword = await bcrypt.hash(data.password, 10);
            delete updateData.password;
        }

        return await adminAccountRepository.update(id, updateData);
    }

    async softDelete(id: string) {
        const account = await this.getDetail(id);
        
        return await adminAccountRepository.update(id, {
            deletedAt: new Date(),
        } as any);
    }
}

export default new AdminAccountService();

