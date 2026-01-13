import {
    VoucherModel,
    IVoucherDocument,
} from '../../models/voucher/voucher.model.mongo';
import { BaseRepository } from '../base.repository';

export class VoucherRepository extends BaseRepository<IVoucherDocument> {
    constructor() {
        super(VoucherModel);
    }

    // Increment usage count
    async incrementUsage(id: string): Promise<IVoucherDocument | null> {
        return await VoucherModel.findByIdAndUpdate(
            id,
            { $inc: { usageCount: 1 } },
            { new: true }
        );
    }

    // Validate voucher for order
    async validateForOrder(
        code: string,
        orderValue: number
    ): Promise<{
        valid: boolean;
        voucher?: IVoucherDocument;
        message?: string;
    }> {
        const voucher = await this.findOne({ code: code.toUpperCase() } as any);

        if (!voucher) {
            return { valid: false, message: 'Voucher not found' };
        }

        // Check if voucher is valid
        const now = new Date();
        const isValid =
            voucher.status === 'ACTIVE' &&
            voucher.deletedAt === null &&
            voucher.startedDate <= now &&
            voucher.endedDate >= now &&
            voucher.usageCount < voucher.usageLimit;

        if (!isValid) {
            return { valid: false, message: 'Voucher is not valid' };
        }

        // Check if can apply to order
        if (orderValue < voucher.minOrderValue) {
            return {
                valid: false,
                message: `Minimum order value is ${voucher.minOrderValue}`,
            };
        }

        return { valid: true, voucher };
    }
}

export const voucherRepository = new VoucherRepository();
