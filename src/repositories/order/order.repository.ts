import {
    OrderModel,
    IOrderDocument,
} from '../../models/order/order.model.mongo';
import { BaseRepository } from '../base.repository';
import mongoose from 'mongoose';
import { OrderType } from '../../config/enums/order.enum';
import { InvoiceStatus } from '../../config/enums/invoice.enum';

export class OrderRepository extends BaseRepository<IOrderDocument> {
    constructor() {
        super(OrderModel);
    }
    // Get order statistics
    async getStatistics(): Promise<{
        total: number;
        byType: { type: string; count: number }[];
        totalRevenue: number;
    }> {
        const total = await this.count();

        const byType = await OrderModel.aggregate([
            { $match: { deletedAt: null } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $project: { type: '$_id', count: 1, _id: 0 } },
        ]);

        const financial = await OrderModel.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$price' },
                },
            },
        ]);

        const totalRevenue = financial[0]?.totalRevenue || 0;

        return { total, byType, totalRevenue };
    }

    /**
     * Get counts of order types within an invoice
     * @param invoiceId 
     * @returns 
     */
    async getOrderTypeCountsByInvoiceId(invoiceId: string) {
        const mongoInvoiceId = new mongoose.Types.ObjectId(invoiceId);
        const result = await OrderModel.aggregate([
            {
                $match: {
                    invoiceId: mongoInvoiceId,
                    deletedAt: null,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalManu: {
                        $sum: {
                            $cond: [
                                { $in: [OrderType.MANUFACTURING, '$type'] },
                                1,
                                0,
                            ],
                        },
                    },
                    totalNormal: {
                        $sum: {
                            $cond: [
                                { $in: [OrderType.NORMAL, '$type'] },
                                1,
                                0,
                            ],
                        },
                    },
                    totalPreOrder: {
                        $sum: {
                            $cond: [
                                { $in: [OrderType.PRE_ORDER, '$type'] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    totalManu: 1,
                    totalNormal: 1,
                    totalPreOrder: 1,
                },
            },
        ]);

        return (
            result[0] || {
                total: 0,
                totalManu: 0,
                totalNormal: 0,
                totalPreOrder: 0,
            }
        );
    }

    /**
     * Get counts of all order types across all orders
     * @returns 
     */
    async getAllOrderTypeCounts() {
        const result = await OrderModel.aggregate([
            {
                $match: {
                    deletedAt: null,
                },
            },
            {
                $lookup: {
                    from: 'invoices',
                    localField: 'invoiceId',
                    foreignField: '_id',
                    as: 'invoice',
                },
            },
            {
                $unwind: '$invoice',
            },
            {
                $match: {
                    'invoice.status': {
                        $in: [
                            InvoiceStatus.PENDING,
                            InvoiceStatus.DEPOSITED,
                            InvoiceStatus.APPROVED,
                            InvoiceStatus.ONBOARD,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalManu: {
                        $sum: {
                            $cond: [
                                { $in: [OrderType.MANUFACTURING, '$type'] },
                                1,
                                0,
                            ],
                        },
                    },
                    totalNormal: {
                        $sum: {
                            $cond: [
                                { $in: [OrderType.NORMAL, '$type'] },
                                1,
                                0,
                            ],
                        },
                    },
                    totalPreOrder: {
                        $sum: {
                            $cond: [
                                { $in: [OrderType.PRE_ORDER, '$type'] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    total: 1,
                    totalManu: 1,
                    totalNormal: 1,
                    totalPreOrder: 1,
                },
            },
        ]);

        return (
            result[0] || {
                total: 0,
                totalManu: 0,
                totalNormal: 0,
                totalPreOrder: 0,
            }
        );
    }
}

export const orderRepository = new OrderRepository();
