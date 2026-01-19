import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import neo4jVoucherService from '../neo4j/voucher.neo4j.service';
import { CreateVoucher, UpdateVoucher } from '../../types/voucher/voucher';
import {
    NotFoundRequestError,
    BadRequestError,
} from '../../errors/apiError/api-error';

class VoucherAdminService {
    /**
     * Create voucher (MongoDB + Neo4j)
     */
    createVoucher = async (payload: CreateVoucher) => {
        try {
            // 1. Create in MongoDB
            const voucher = await voucherRepository.create(payload as any);

            // 2. Create node in Neo4j
            await neo4jVoucherService.createVoucherNode(
                voucher._id.toString(),
                voucher.code
            );

            return voucher;
        } catch (error: any) {
            // Rollback if Neo4j fails
            if (error.message?.includes('Neo4j')) {
                // Delete from MongoDB if Neo4j creation failed
                throw new BadRequestError(
                    'Failed to create voucher in graph database'
                );
            }
            throw error;
        }
    };

    /**
     * Get vouchers list
     */
    getVouchers = async (
        page: number = 1,
        limit: number = 10,
        status?: string,
        applyScope?: string
    ) => {
        const filter: any = {
            deletedAt: null,
        };

        if (status) {
            filter.status = status;
        }

        if (applyScope) {
            filter.applyScope = applyScope;
        }

        const skip = (page - 1) * limit;
        const items = await voucherRepository.find(filter, {
            limit,
            sort: { createdAt: -1 },
        } as any);
        const total = await voucherRepository.count(filter);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    };

    /**
     * Get voucher detail
     */
    getVoucherDetail = async (voucherId: string) => {
        const voucher = await voucherRepository.findById(voucherId);

        if (!voucher) {
            throw new NotFoundRequestError('Voucher not found');
        }

        // Get Neo4j statistics
        const stats = await neo4jVoucherService.getVoucherStatistics(voucherId);

        return {
            ...voucher.toObject(),
            neo4jStats: stats,
        };
    };

    /**
     * Update voucher
     */
    updateVoucher = async (voucherId: string, payload: UpdateVoucher) => {
        const voucher = await voucherRepository.findById(voucherId);

        if (!voucher) {
            throw new NotFoundRequestError('Voucher not found');
        }

        const updated = await voucherRepository.update(voucherId, payload);
        return updated;
    };

    /**
     * Delete voucher (soft delete + Neo4j cleanup)
     */
    deleteVoucher = async (voucherId: string) => {
        const voucher = await voucherRepository.findById(voucherId);

        if (!voucher) {
            throw new NotFoundRequestError('Voucher not found');
        }

        // 1. Soft delete in MongoDB
        await voucherRepository.delete(voucherId);

        // 2. Delete node and relationships in Neo4j
        await neo4jVoucherService.deleteVoucherNode(voucherId);

        return { message: 'Voucher deleted successfully' };
    };

    /**
     * Grant voucher to users
     */
    grantVoucherToUsers = async (
        voucherId: string,
        userIds: string[],
        grantedBy: string
    ) => {
        // 1. Validate voucher exists
        const voucher = await voucherRepository.findById(voucherId);
        if (!voucher) {
            throw new NotFoundRequestError('Voucher not found');
        }

        // 2. Grant in Neo4j
        const count = await neo4jVoucherService.grantVoucherToUsers(
            userIds,
            voucherId,
            grantedBy
        );

        return {
            voucherCode: voucher.code,
            grantedCount: count,
        };
    };

    /**
     * Revoke voucher from users
     */
    revokeVoucherFromUsers = async (voucherId: string, userIds: string[]) => {
        // 1. Validate voucher exists
        const voucher = await voucherRepository.findById(voucherId);
        if (!voucher) {
            throw new NotFoundRequestError('Voucher not found');
        }

        // 2. Revoke in Neo4j
        const count = await neo4jVoucherService.revokeVoucherFromUsers(
            userIds,
            voucherId
        );

        return {
            voucherCode: voucher.code,
            revokedCount: count,
        };
    };

    /**
     * Get users who have specific voucher
     */
    getVoucherUsers = async (voucherId: string) => {
        // 1. Validate voucher exists
        const voucher = await voucherRepository.findById(voucherId);
        if (!voucher) {
            throw new NotFoundRequestError('Voucher not found');
        }

        // 2. Get users from Neo4j
        const users = await neo4jVoucherService.getVoucherUsers(voucherId);

        return {
            voucher: {
                code: voucher.code,
                name: voucher.name,
            },
            users,
        };
    };

    /**
     * Get user's vouchers
     */
    getUserVouchers = async (userId: string) => {
        // Get voucher IDs from Neo4j
        const voucherIds = await neo4jVoucherService.getUserVouchers(userId);

        if (voucherIds.length === 0) {
            return { vouchers: [] };
        }

        // Get voucher details from MongoDB
        const vouchers = await voucherRepository.find({
            _id: { $in: voucherIds } as any,
            deletedAt: null,
        } as any);

        return { vouchers };
    };

    /**
     * Get voucher statistics
     */
    getStatistics = async () => {
        const stats = await voucherRepository.getStatistics();
        return stats;
    };
}

export default new VoucherAdminService();
