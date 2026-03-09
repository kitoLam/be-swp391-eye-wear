import z from 'zod';
import { OrderStatus, OrderType } from '../../config/enums/order.enum';

export const OrderListAdminQuerySchema = z.object({
    page: z.coerce.number().min(1).catch(1),
    limit: z.coerce.number().min(1).max(1000).catch(10),
    status: z.enum(OrderStatus).optional().catch(undefined),
    orderCode: z.string().optional().catch(undefined),
    type: z.enum(OrderType).optional().catch(undefined),
    sortBy: z.enum(['createdAt', 'startedAt']).optional().default('createdAt').catch('createdAt'),
    sortValue: z.enum(['asc', 'desc']).optional().default('desc').catch('desc'),
});
export const OrderStatsQuerySchema = z.object({
    staffId: z.string().min(1, 'Staff ID is required'),
});
export const OrderCountTotalQuerySchema = z.object({
    invoiceId: z.string().optional().catch(undefined),
    status: z.enum(OrderStatus).optional().catch(undefined),
    search: z.string().optional().catch(undefined),
});
export type OrderListAdminQuery = z.infer<typeof OrderListAdminQuerySchema>;
export type OrderStatsQuery = z.infer<typeof OrderStatsQuerySchema>;
export type OrderCountTotalQuery = z.infer<typeof OrderCountTotalQuerySchema>;
