import z from 'zod';
import { OrderProductSchema } from './order-product';

// Order Schema
export const OrderSchema = z.object({
    _id: z.string().min(1, 'Order ID is required'),
    type: z.enum(['NORMAL', 'PRE-ORDER', 'CUSTOM']),
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),
});

// Create Order Schema
export const CreateOrderSchema = z.object({
    type: z.enum(['NORMAL', 'PRE-ORDER', 'CUSTOM']),
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    price: z.number().min(0, 'Price must be non-negative'),
});

// Update Order Schema
export const UpdateOrderSchema = z.object({
    type: z.enum(['NORMAL', 'PRE-ORDER', 'CUSTOM']).optional(),
    products: z.array(OrderProductSchema).optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;
