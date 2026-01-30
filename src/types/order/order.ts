import z from 'zod';
import { OrderProductSchema } from './order-product';
import {
    OrderStatus,
    OrderType,
} from '../../config/enums/order.enum';
import { Types } from 'mongoose';

// Order Schema
export const OrderSchema = z.object({
    _id: z.string(),
    invoiceId: z.string().or(z.instanceof(Types.ObjectId)),
    orderCode: z.string(),
    type: z.array(z.enum(OrderType)),
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    status: z.enum(OrderStatus),

    assignerStaff: z.string().nullable(),
    assignedStaff: z.string().nullable(),
    assignedAt: z.date().nullable(),
    startedAt: z.date().nullable(),
    completedAt: z.date().nullable(),

    price: z.number().min(0, 'Price must be non-negative'),

    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

// Type exports
export type Order = z.infer<typeof OrderSchema>;
