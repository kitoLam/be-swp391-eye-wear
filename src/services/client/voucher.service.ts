import { voucherRepository } from '../../repositories/voucher/voucher.repository';
import neo4jVoucherService from '../neo4j/voucher.neo4j.service';
import {
    NotFoundRequestError,
    BadRequestError,
} from '../../errors/apiError/api-error';

interface ValidateVoucherPayload {
    code: string;
    orderValue: number;
}

class VoucherClientService {
    /**
     * Get user's available vouchers (unused only)
     */
    getMyVouchers = async (customerId: string) => {
        // 1. Get unused voucher IDs from Neo4j
        const voucherIds =
            await neo4jVoucherService.getUserUnusedVouchers(customerId);

        if (voucherIds.length === 0) {
            return { vouchers: [] };
        }

        // 2. Get voucher details from MongoDB
        const vouchers = await voucherRepository.find({
            _id: { $in: voucherIds } as any,
            status: 'ACTIVE',
            deletedAt: null,
        } as any);

        // 3. Filter by validity (date range, usage limit)
        const now = new Date();
        const availableVouchers = (vouchers as unknown as any[]).filter(
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
            const hasAccess = await neo4jVoucherService.userHasVoucher(
                customerId,
                voucher._id.toString()
            );
            if (!hasAccess) {
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
}

export default new VoucherClientService();
export { ValidateVoucherPayload };
