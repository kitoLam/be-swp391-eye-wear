import {
    PaymentModel,
    IPaymentDocument,
} from '../../models/payment/payment.model.mongo';
import { BaseRepository } from '../base.repository';

export class PaymentRepository extends BaseRepository<IPaymentDocument> {
    constructor() {
        super(PaymentModel);
    }

    // Get payment statistics
    async getStatistics(): Promise<{
        total: number;
        byStatus: { status: string; count: number }[];
        byMethod: { method: string; count: number }[];
        totalAmount: number;
    }> {
        const total = await this.count();
        const byStatus = await PaymentModel.aggregate([
            { $match: { deletedAt: null } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { status: '$_id', count: 1, _id: 0 } },
        ]);
        const byMethod = await PaymentModel.aggregate([
            { $match: { deletedAt: null } },
            { $group: { _id: '$payment_method', count: { $sum: 1 } } },
            { $project: { method: '$_id', count: 1, _id: 0 } },
        ]);
        const amount = await PaymentModel.aggregate([
            { $match: { deletedAt: null, status: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$price' } } },
        ]);
        const totalAmount = amount[0]?.total || 0;

        return { total, byStatus, byMethod, totalAmount };
    }
}

export const paymentRepository = new PaymentRepository();
