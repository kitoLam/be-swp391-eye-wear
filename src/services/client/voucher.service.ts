import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import { voucherSupabaseRepository } from '../../repositories/voucher/voucher.supabase.repository';
import { supabase } from '../../config/supabase.config';
import {
    NotFoundRequestError,
    BadRequestError,
} from '../../errors/apiError/api-error';
import { VoucherClaimStatus } from '../../config/enums/voucher.enum';

interface ValidateVoucherPayload {
    code: string;
    orderValue: number;
}

class VoucherClientService {
    /**
     * Get vouchers by clientId (Supabase only)
     */
    getVouchersByClientId = async (clientId: string) => {
        return await voucherSupabaseRepository.getVouchersByCustomerId(
            clientId
        );
    };

    /**
     * Assign voucher to user (Supabase)
     */
    assignVoucher = async (
        customerId: string,
        voucherId: string,
        metadata: any = {}
    ) => {
        // 1. Check if customer exists in Supabase, if not create
        const { data: customer } = await supabase
            .from('customer')
            .select('id')
            .eq('id', customerId)
            .single();

        if (!customer) {
            await supabase.from('customer').insert([{ id: customerId }]);
        }

        // 2. Check if voucher exists in Supabase, if not create
        const { data: voucher } = await supabase
            .from('voucher')
            .select('id')
            .eq('id', voucherId)
            .single();

        if (!voucher) {
            // We need the code to create it, but here we only have ID.
            // Ideally we should sync from Mongo or just insert ID if Supabase allows.
            // Assuming voucherId is UUID.
            await supabase
                .from('voucher')
                .insert([{ id: voucherId, code: 'UNKNOWN_' + voucherId }]);
        }

        // 3. Assign
        const { data, error } = await supabase
            .from('voucher_user')
            .insert([
                {
                    customer_id: customerId,
                    voucher_id: voucherId,
                    metadata: metadata,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ])
            .select();

        if (error) {
            throw new BadRequestError(error.message);
        }

        return data[0];
    };

    /**
     * Get user's available vouchers (unused only)
     */
    getMyVouchers = async (customerId: string) => {
        // 1. Get user-assigned voucher IDs from Supabase (không bắt buộc metadata.status = CLAIMED)
        const { data: userVouchers, error } = await supabase
            .from('voucher_user')
            .select('voucher_id')
            .eq('customer_id', customerId)
            .is('deleted_at', null);

        if (error) {
            throw new BadRequestError(error.message);
        }

        const voucherIds = userVouchers.map((v: any) => v.voucher_id);

        // 2. Get vouchers assigned to user (SPECIFIC flow)
        const assignedVoucherResult = voucherIds.length
            ? await voucherRepository.find(
                  {
                      _id: { $in: voucherIds } as any,
                      status: 'ACTIVE',
                      deletedAt: null,
                  } as any,
                  {
                      page: 1,
                      limit: voucherIds.length || 100,
                  }
              )
            : { data: [] as any[] };

        // 3. Get ALL-scope vouchers to always show in my-vouchers
        const allScopeVouchersResult = await voucherRepository.find(
            {
                applyScope: 'ALL',
                status: 'ACTIVE',
                deletedAt: null,
            } as any,
            {
                page: 1,
                limit: 1000,
            }
        );

        // 4. Merge + dedupe by voucher id
        const mergedMap = new Map<string, any>();
        for (const voucher of assignedVoucherResult.data || []) {
            mergedMap.set(voucher._id.toString(), voucher);
        }
        for (const voucher of allScopeVouchersResult.data || []) {
            mergedMap.set(voucher._id.toString(), voucher);
        }

        // 5. Filter by validity (date range, usage limit)
        const now = new Date();
        const availableVouchers = Array.from(mergedMap.values()).filter(
            (voucher: any) =>
                voucher.startedDate <= now &&
                voucher.endedDate >= now &&
                voucher.usageCount < voucher.usageLimit
        );

        return { vouchers: availableVouchers };
    };

    /**
     * Validate voucher code for order
     */
    validateVoucher = async (
        customerId: string,
        payload: ValidateVoucherPayload
    ) => {
        const { code, orderValue } = payload;

        // 1. Find voucher by code
        const voucher = await voucherRepository.findOne({
            code: code.toUpperCase(),
            deletedAt: null,
        });

        if (!voucher) {
            throw new NotFoundRequestError('Voucher không tồn tại');
        }

        // 2. Check if voucher is active
        if (voucher.status !== 'ACTIVE') {
            throw new BadRequestError('Voucher chưa được kích hoạt');
        }

        // 3. Check date range
        const now = new Date();
        if (now < voucher.startedDate) {
            throw new BadRequestError('Voucher chưa đến thời gian sử dụng');
        }
        if (now > voucher.endedDate) {
            throw new BadRequestError('Voucher đã hết hạn');
        }

        // 4. Check usage limit
        if (voucher.usageCount >= voucher.usageLimit) {
            throw new BadRequestError('Voucher đã hết lượt sử dụng');
        }

        // 5. Check if user has access (for SPECIFIC vouchers)
        if (voucher.applyScope === 'SPECIFIC') {
            // Check Supabase
            const { data, error } = await supabase
                .from('voucher_user')
                .select('id')
                .eq('customer_id', customerId)
                .eq('voucher_id', voucher._id.toString())
                .is('deleted_at', null)
                .single();

            if (error || !data) {
                throw new BadRequestError(
                    'Bạn không có quyền sử dụng voucher này'
                );
            }
        }

        // 6. Check minimum order value
        if (orderValue < voucher.minOrderValue) {
            throw new BadRequestError(
                `Giá trị đơn hàng tối thiểu là ${voucher.minOrderValue.toLocaleString()}đ`
            );
        }

        // 7. Calculate discount
        let discount = 0;
        if (voucher.typeDiscount === 'FIXED') {
            discount = voucher.value;
        } else if (voucher.typeDiscount === 'PERCENTAGE') {
            discount = (orderValue * voucher.value) / 100;
        }

        // Apply max discount limit
        discount = Math.min(discount, voucher.maxDiscountValue);

        // Ensure discount doesn't exceed order value
        discount = Math.min(discount, orderValue);

        const finalAmount = orderValue - discount;

        return {
            valid: true,
            voucher: {
                code: voucher.code,
                name: voucher.name,
                typeDiscount: voucher.typeDiscount,
                value: voucher.value,
                maxDiscountValue: voucher.maxDiscountValue,
                _id: voucher._id, // Return ID for reference
            },
            discount,
            finalAmount,
        };
    };

    /**
     * Get all available vouchers (for display purposes)
     */
    getAvailableVouchers = async () => {
        const now = new Date();

        const vouchers = await voucherRepository.find({
            status: 'ACTIVE',
            applyScope: 'ALL',
            deletedAt: null,
        } as any);

        // Filter by date and usage limit
        const available = (vouchers as unknown as any[]).filter(
            (v: any) =>
                v.startedDate <= now &&
                v.endedDate >= now &&
                v.usageCount < v.usageLimit
        );

        return { vouchers: available };
    };

    /**
     * Claim voucher - Update status from WAITING_CLAIM to CLAIMED
     */
    claimVoucher = async (customerId: string, voucherCode: string) => {
        // 1. Find voucher by code
        const voucher = await voucherRepository.findOne({
            code: voucherCode.toUpperCase(),
            deletedAt: null,
        });

        if (!voucher) {
            throw new NotFoundRequestError('Voucher không tồn tại');
        }

        // 2. Check if user has this voucher in Supabase
        const { data: voucherUser, error: fetchError } = await supabase
            .from('voucher_user')
            .select('*')
            .eq('customer_id', customerId)
            .eq('voucher_id', voucher._id.toString())
            .is('deleted_at', null)
            .single();

        if (fetchError || !voucherUser) {
            throw new BadRequestError('Bạn không có voucher này');
        }

        // 3. Check current status in metadata
        const currentStatus = voucherUser.metadata?.status;

        if (currentStatus === VoucherClaimStatus.CLAIMED) {
            throw new BadRequestError('Voucher đã được claim rồi');
        }

        if (currentStatus !== VoucherClaimStatus.WAITING_CLAIM) {
            throw new BadRequestError('Voucher không ở trạng thái chờ claim');
        }

        // 4. Update status to CLAIMED
        const updatedMetadata = {
            ...voucherUser.metadata,
            status: VoucherClaimStatus.CLAIMED,
            claimed_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
            .from('voucher_user')
            .update({
                metadata: updatedMetadata,
                updated_at: new Date().toISOString(),
            })
            .eq('customer_id', customerId)
            .eq('voucher_id', voucher._id.toString());

        if (updateError) {
            throw new BadRequestError('Không thể claim voucher: ' + updateError.message);
        }

        return {
            message: 'Claim voucher thành công',
            voucher: {
                code: voucher.code,
                name: voucher.name,
            },
        };
    };
}

export default new VoucherClientService();
export { ValidateVoucherPayload };
