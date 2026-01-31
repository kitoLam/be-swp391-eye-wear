import {
    InvoiceModel,
    IInvoiceDocument,
} from '../../models/invoice/invoice.model.mongo';
import { BaseRepository } from '../base.repository';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import { DepositedInvoiceResponse } from '../../types/invoice/deposited-invoice.response';

export class InvoiceRepository extends BaseRepository<IInvoiceDocument> {
    constructor() {
        super(InvoiceModel);
    }

    // Get invoices by owner
    async findByOwner(ownerId: string): Promise<IInvoiceDocument[]> {
        const result = await this.find({ owner: ownerId });
        return result.data;
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

    /**
     * Get deposited invoices with order types using MongoDB aggregation
     * Uses aggregation pipeline for optimal performance (single query)
     * @returns Array of invoices with orders mapped to {id, type} format
     */
    async getDepositedInvoicesWithOrderTypes(): Promise<
        DepositedInvoiceResponse[]
    > {
        const result = await InvoiceModel.aggregate([
            // Stage 1: Filter invoices with DEPOSITED status
            {
                $match: {
                    status: InvoiceStatus.DEPOSITED,
                    deletedAt: null,
                },
            },
            // Stage 2: Join with Orders collection
            {
                $lookup: {
                    from: 'orders', // Collection name in MongoDB
                    localField: '_id',
                    foreignField: 'invoiceId',
                    as: 'orderDetails',
                },
            },
            // Stage 3: Transform data and map orders
            {
                $project: {
                    _id: 1,
                    invoiceCode: 1,
                    owner: 1,
                    totalPrice: 1,
                    totalDiscount: 1,
                    status: 1,
                    fullName: 1,
                    phone: 1,
                    address: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    // Transform orderDetails array to orders with {id, type} format
                    orders: {
                        $map: {
                            input: '$orderDetails',
                            as: 'order',
                            in: {
                                id: { $toString: '$$order._id' },
                                type: '$$order.type',
                            },
                        },
                    },
                },
            },
            // Stage 4: Sort by creation date (newest first)
            {
                $sort: { createdAt: -1 },
            },
        ]);

        return result as DepositedInvoiceResponse[];
    }
}

export const invoiceRepository = new InvoiceRepository();
