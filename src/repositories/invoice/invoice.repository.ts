import {
    InvoiceModel,
    IInvoiceDocument,
} from '../../models/invoice/invoice.model.mongo';
import { BaseRepository } from '../base.repository';
import { InvoiceStatus } from '../../config/enums/invoice.enum';
import { DepositedInvoiceResponse } from '../../types/invoice/deposited-invoice.response';
import { FilterQuery } from 'mongoose';
import {
    InvoiceRevenuePeriod,
    InvoiceRevenueQuery,
    InvoiceTopSaleQuery,
} from '../../types/invoice/invoice.query';

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

    async getRevenueByPeriod(params: InvoiceRevenueQuery): Promise<
        {
            period: string;
            totalRevenue: number;
            invoiceCount: number;
        }[]
    > {
        const timezone = 'Asia/Ho_Chi_Minh';
        const dateFormatByPeriod: Record<InvoiceRevenuePeriod, string> = {
            [InvoiceRevenuePeriod.YEAR]: '%Y',
            [InvoiceRevenuePeriod.MONTH]: '%Y-%m',
            [InvoiceRevenuePeriod.WEEK]: '%G-W%V',
            [InvoiceRevenuePeriod.DAY]: '%Y-%m-%d',
        };

        const match: FilterQuery<IInvoiceDocument> = {
            deletedAt: null,
            status: InvoiceStatus.DELIVERED,
        };

        if (params.fromDate || params.toDate) {
            match.createdAt = {} as any;
            if (params.fromDate) {
                (match.createdAt as any).$gte = new Date(params.fromDate);
            }
            if (params.toDate) {
                (match.createdAt as any).$lte = new Date(params.toDate);
            }
        }

        if (params.userId) {
            match.owner = params.userId;
        }

        const result = await InvoiceModel.aggregate([
            { $match: match },
            {
                $project: {
                    period: {
                        $dateToString: {
                            format: dateFormatByPeriod[params.period],
                            date: '$createdAt',
                            timezone,
                        },
                    },
                    revenue: {
                        $max: [
                            {
                                $subtract: [
                                    { $ifNull: ['$totalPrice', 0] },
                                    { $ifNull: ['$totalDiscount', 0] },
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: '$period',
                    totalRevenue: { $sum: '$revenue' },
                    invoiceCount: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    period: '$_id',
                    totalRevenue: 1,
                    invoiceCount: 1,
                },
            },
        ]);

        return result;
    }

    async getTopPurchaseCities(limit = 3): Promise<
        {
            city: string;
            totalQuantity: number;
            totalAmount: number;
            invoiceCount: number;
        }[]
    > {
        const result = await InvoiceModel.aggregate([
            {
                $match: {
                    deletedAt: null,
                    status: InvoiceStatus.DELIVERED,
                },
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'invoiceId',
                    as: 'orderDetails',
                },
            },
            {
                $addFields: {
                    totalQuantity: {
                        $reduce: {
                            input: '$orderDetails',
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$value',
                                    {
                                        $sum: {
                                            $map: {
                                                input: { $ifNull: ['$this.products', []] },
                                                as: 'p',
                                                in: { $ifNull: ['$p.quantity', 0] },
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    finalAmount: {
                        $max: [
                            {
                                $subtract: [
                                    { $ifNull: ['$totalPrice', 0] },
                                    { $ifNull: ['$totalDiscount', 0] },
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: '$address.city',
                    totalQuantity: { $sum: '$totalQuantity' },
                    totalAmount: { $sum: '$finalAmount' },
                    invoiceCount: { $sum: 1 },
                },
            },
            { $sort: { totalQuantity: -1, totalAmount: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    city: '$_id',
                    totalQuantity: 1,
                    totalAmount: 1,
                    invoiceCount: 1,
                },
            },
        ]);

        return result;
    }

    async getTopSellingProductsByMonth(
        query: InvoiceTopSaleQuery,
        limit = 8
    ): Promise<
        {
            productId: string;
            sku: string;
            totalQuantity: number;
            totalRevenue: number;
        }[]
    > {
        const now = new Date();
        const month = query.month ?? now.getMonth() + 1;
        const year = query.year ?? now.getFullYear();

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        const result = await InvoiceModel.aggregate([
            {
                $match: {
                    deletedAt: null,
                    status: InvoiceStatus.DELIVERED,
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                },
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'invoiceId',
                    as: 'orderDetails',
                },
            },
            { $unwind: '$orderDetails' },
            { $unwind: '$orderDetails.products' },
            {
                $match: {
                    'orderDetails.products.product': { $ne: null },
                },
            },
            {
                $project: {
                    productId: '$orderDetails.products.product.product_id',
                    sku: '$orderDetails.products.product.sku',
                    quantity: { $ifNull: ['$orderDetails.products.quantity', 0] },
                    lineRevenue: {
                        $multiply: [
                            { $ifNull: ['$orderDetails.products.quantity', 0] },
                            { $ifNull: ['$orderDetails.products.product.pricePerUnit', 0] },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: {
                        productId: '$productId',
                        sku: '$sku',
                    },
                    totalQuantity: { $sum: '$quantity' },
                    totalRevenue: { $sum: '$lineRevenue' },
                },
            },
            { $sort: { totalQuantity: -1, totalRevenue: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    productId: '$_id.productId',
                    sku: '$_id.sku',
                    totalQuantity: 1,
                    totalRevenue: 1,
                },
            },
        ]);

        return result;
    }
}

export const invoiceRepository = new InvoiceRepository();
