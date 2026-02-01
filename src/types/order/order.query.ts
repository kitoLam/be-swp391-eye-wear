import z from 'zod';
import { OrderStatus } from '../../config/enums/order.enum';

export const OrderListAdminQuerySchema = z.object({
    page: z.coerce.number().min(1).catch(1),
    limit: z.coerce.number().min(1).max(1000).catch(10),
    status: z.enum(OrderStatus).optional().catch(undefined),
    orderCode: z.string().optional().catch(undefined),
});
export const OrderStatsQuerySchema = z.object({
    staffId: z.string().min(1, 'Staff ID is required'),
});
export type OrderListAdminQuery = z.infer<typeof OrderListAdminQuerySchema>;
export type OrderStatsQuery = z.infer<typeof OrderStatsQuerySchema>;
