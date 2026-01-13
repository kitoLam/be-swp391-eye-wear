import {
    OrderModel,
    IOrderDocument,
} from '../../models/order/order.model.mongo';
import { BaseRepository } from '../base.repository';

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
        const revenue = await OrderModel.aggregate([
            { $match: { deletedAt: null } },
            { $group: { _id: null, total: { $sum: '$price' } } },
        ]);
        const totalRevenue = revenue[0]?.total || 0;

        return { total, byType, totalRevenue };
    }
}

export const orderRepository = new OrderRepository();
