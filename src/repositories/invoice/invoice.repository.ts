import {
    InvoiceModel,
    IInvoiceDocument,
} from '../../models/invoice/invoice.model.mongo';
import { BaseRepository } from '../base.repository';

export class InvoiceRepository extends BaseRepository<IInvoiceDocument> {
    constructor() {
        super(InvoiceModel);
    }

    // Update status
    async updateStatus(
        id: string,
        status: 'PENDING' | 'DEPOSITED' | 'PAIDED' | 'COMPLETE'
    ): Promise<IInvoiceDocument | null> {
        return await this.update(id, { status } as any);
    }

    // Get invoice statistics
    async getStatistics(): Promise<{
        total: number;
        byStatus: { status: string; count: number }[];
        totalRevenue: number;
        totalDiscount: number;
    }> {
        const total = await this.count();
        const byStatus = await InvoiceModel.aggregate([
            { $match: { deletedAt: null } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $project: { status: '$_id', count: 1, _id: 0 } },
        ]);
        const financial = await InvoiceModel.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                    totalDiscount: { $sum: '$totalDiscount' },
                },
            },
        ]);
        const totalRevenue = financial[0]?.totalRevenue || 0;
        const totalDiscount = financial[0]?.totalDiscount || 0;

        return { total, byStatus, totalRevenue, totalDiscount };
    }
}

export const invoiceRepository = new InvoiceRepository();
