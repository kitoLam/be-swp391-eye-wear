import {
    InvoiceModel,
    IInvoiceDocument,
} from '../../models/invoice/invoice.model.mongo';
import { BaseRepository } from '../base.repository';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import { DepositedInvoiceResponse } from '../../types/invoice/deposited-invoice.response';
import { FilterQuery } from 'mongoose';

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

    async getInvoiceListWithOrderTypes(params: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        statuses?: string[];
        staffHandleDelivery?: string;
    }): Promise<{ data: DepositedInvoiceResponse[]; total: number }> {
        const match: FilterQuery<IInvoiceDocument> = { deletedAt: null };

        if (params.search) {
            const regex = new RegExp(params.search, 'gi');
            match.$or = [{ invoiceCode: regex }, { fullName: regex }];
        }

        if (params.status) {
            match.status = params.status as any;
        }

        if (params.statuses?.length) {
            match.status = { $in: params.statuses } as any;
        }

        if (params.staffHandleDelivery) {
            match.staffHandleDelivery = params.staffHandleDelivery;
        }

        const skip = (params.page - 1) * params.limit;

        const result = await InvoiceModel.aggregate([
            { $match: match },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: params.limit },
                        {
                            $lookup: {
                                from: 'orders',
                                localField: '_id',
                                foreignField: 'invoiceId',
                                as: 'orderDetails',
                            },
                        },
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
                                orders: {
                                    $map: {
                                        input: '$orderDetails',
                                        as: 'order',
                                        in: { $toString: '$$order._id' },
                                    },
                                },
                            },
                        },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
            {
                $project: {
                    data: 1,
                    total: {
                        $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0],
                    },
                },
            },
        ]);

        const first = result[0] as unknown as {
            data: DepositedInvoiceResponse[];
            total: number;
        };

        return {
            data: first?.data ?? [],
            total: first?.total ?? 0,
        };
    }
}

export const invoiceRepository = new InvoiceRepository();
