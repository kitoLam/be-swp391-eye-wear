import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import { supabase } from '../../config/supabase.config';
import { CreateVoucher, UpdateVoucher } from '../../types/voucher/voucher';
import {
    VoucherStatus,
    VoucherApplyScope,
    VoucherClaimStatus,
} from '../../config/enums/voucher.enum';
import {
    NotFoundRequestError,
    BadRequestError,
} from '../../errors/apiError/api-error';
import moment from 'moment';
import {
    addVoucherToTimeoutQueue,
    removeVoucherJobFromQueue,
} from '../../queues/voucher.queue';

class VoucherAdminService {
    /**
     * Create voucher (MongoDB + Neo4j)
     */
    createVoucher = async (payload: CreateVoucher) => {
        try {
            if (
                moment(
                    moment(payload.startedDate).endOf('date').toDate()
                ).isBefore(moment(new Date()).startOf('date').toDate())
            ) {
                throw new BadRequestError(
                    'Started date must be equal or after today'
                );
            }
            const isDuplicateCode = await voucherRepository.findOne({
                code: payload.code,
            });
            if (isDuplicateCode) {
                throw new BadRequestError('Voucher can not be duplicated');
            }

            // Validate status ACTIVE
            if (payload.status === VoucherStatus.ACTIVE) {
                const now = moment();
                const startDate = moment(payload.startedDate).startOf('date');
                const endDate = moment(payload.endedDate).endOf('date');

                const isInValidPeriod = now.isBetween(
                    startDate,
                    endDate,
                    null,
                    '[]'
                );

                if (!isInValidPeriod) {
                    throw new BadRequestError(
                        'Status can only be ACTIVE when current date is between startedDate and endedDate'
                    );
                }
            }

            // 1. Create in MongoDB
            const voucher = await voucherRepository.create(payload as any);

            // 2. Create in Supabase
            const { error } = await supabase.from('voucher').insert([
                {
                    id: voucher._id.toString(),
                    code: voucher.code,
                    created_at: new Date(),
                },
            ]);
            if (error) {
                // Delete from MongoDB if Supabase creation failed
                await voucherRepository.delete(voucher._id.toString());
                throw new BadRequestError(
                    'Failed to create voucher in Supabase: ' + error.message
                );
            }
            await addVoucherToTimeoutQueue(
                {
                    voucherId: voucher._id.toString(),
                },
                payload.startedDate
            );

            return voucher;
        } catch (error: any) {
            throw error;
        }
    };

    /**
     * Get vouchers list
     */
    getVouchers = async (
        page: number = 1,
        limit: number = 10,
        status?: VoucherStatus,
        applyScope?: VoucherApplyScope,
        code?: string,
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
        if(code){
            filter.code = new RegExp(code, 'i');
        }
        const skip = (page - 1) * limit;
        const items = await voucherRepository.find(filter, {
            limit,
            sort: { createdAt: -1 },
        } as any);
        const total = await voucherRepository.count(filter);

        return {
            voucherList: items.data,
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

        return {
            ...voucher.toObject(),
            // neo4jStats: stats, // Removed Neo4j stats
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

        // Validate status ACTIVE
        if (payload.status === VoucherStatus.ACTIVE) {
            const now = moment();
            const startDate = moment(
                payload.startedDate || voucher.startedDate
            ).startOf('date');
            const endDate = moment(
                payload.endedDate || voucher.endedDate
            ).endOf('date');

            const isInValidPeriod = now.isBetween(
                startDate,
                endDate,
                null,
                '[]'
            );

            if (!isInValidPeriod) {
                throw new BadRequestError(
                    'Status can only be ACTIVE when current date is between startedDate and endedDate'
                );
            }
        }

        if (payload.startedDate) {
            const currentDate = moment().startOf('date');
            const existingStartDate = moment(voucher.startedDate).startOf(
                'date'
            );
            const existingEndDate = moment(voucher.endedDate).endOf('date');
            if (
                !moment(existingStartDate).isSame(
                    moment(payload.startedDate).startOf('date').toDate()
                )
            ) {
                const isCurrentDateInRange = currentDate.isBetween(
                    existingStartDate,
                    existingEndDate,
                    null,
                    '[]'
                );

                if (isCurrentDateInRange) {
                    throw new BadRequestError(
                        'Cannot update startedDate while voucher is currently within the voucher period'
                    );
                }
                await removeVoucherJobFromQueue({
                    voucherId: voucherId,
                });
                await addVoucherToTimeoutQueue(
                    {
                        voucherId: voucherId,
                    },
                    payload.startedDate
                );
            }
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

        // 2. Delete from Supabase (or soft delete if you prefer)
        await supabase.from('voucher').delete().eq('id', voucherId);
        // Also delete related voucher_user records? Supabase FK cascade should handle it if configured.
        // Or if soft delete:
        // await supabase.from('voucher').update({ deleted_at: new Date() }).eq('id', voucherId);

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

        // 2. Grant in Supabase
        const records = userIds.map(userId => ({
            id: crypto.randomUUID(),
            customer_id: userId,
            voucher_id: voucherId,
            metadata: {
                granted_by: grantedBy,
                status: VoucherClaimStatus.WAITING_CLAIM,
            },
            created_at: new Date(),
            updated_at: new Date(),
        }));

        const { data, error } = await supabase
            .from('voucher_user')
            .insert(records)
            .select();

        if (error) {
            throw new BadRequestError(
                'Failed to grant vouchers: ' + error.message
            );
        }

        return {
            voucherCode: voucher.code,
            grantedCount: data.length,
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

        // 2. Revoke in Supabase (Soft delete or Hard delete)
        // Assuming hard delete for revoke as per Neo4j logic usually implies removing the relationship
        const { error } = await supabase
            .from('voucher_user')
            .delete()
            .eq('voucher_id', voucherId)
            .in('customer_id', userIds);

        if (error) {
            throw new BadRequestError(
                'Failed to revoke vouchers: ' + error.message
            );
        }

        return {
            voucherCode: voucher.code,
            revokedCount: userIds.length, // Supabase delete doesn't return count easily without select
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

        // 2. Get users from Supabase
        const { data: voucherUsers, error } = await supabase
            .from('voucher_user')
            .select('customer_id')
            .eq('voucher_id', voucherId)
            .is('deleted_at', null);

        if (error) {
            throw new BadRequestError(error.message);
        }

        // We might need to fetch user details from MongoDB if we only have IDs
        // But the original code returned what Neo4j returned (likely IDs or basic info).
        // Let's assume we return IDs for now.
        const users = voucherUsers.map((v: any) => v.customer_id);

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
        // Get voucher IDs from Supabase
        const { data: userVouchers, error } = await supabase
            .from('voucher_user')
            .select('voucher_id')
            .eq('customer_id', userId)
            .is('deleted_at', null);

        if (error) {
            throw new BadRequestError(error.message);
        }

        const voucherIds = userVouchers.map((v: any) => v.voucher_id);

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
