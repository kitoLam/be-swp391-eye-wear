import z from 'zod';
import { OrderProductSchema } from './order-product';
import {
    AssignmentOrderStatus,
    OrderStatus,
    OrderType,
} from '../../config/enums/order.enum';

// Order Schema
export const OrderSchema = z.object({
    _id: z.string().optional(),
    type: z.enum(OrderType),
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    status: z.enum(OrderStatus),

    // Assignment fields (flattened from assignment)
    staffId: z.string().nullable(),
    assignStaff: z.string().nullable(),
    assignedAt: z.date().nullable(),
    startedAt: z.date().nullable(),
    completedAt: z.date().nullable(),
    assignmentStatus: z.enum(AssignmentOrderStatus),

    price: z.number().min(0, 'Price must be non-negative'),

    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

// Create Order Schema (for creating new orders)
export const CreateOrderSchema = z.object({
    type: z.nativeEnum(OrderType),
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING),
    staffVerified: z.string().nullable().optional(),
    assignmentStatus: z
        .nativeEnum(AssignmentOrderStatus)
        .default(AssignmentOrderStatus.PENDING),
    staffId: z.string().nullable().optional(),
    assignStaff: z.string().nullable().optional(),
});

// Update Order Schema
export const UpdateOrderSchema = z.object({
    type: z.nativeEnum(OrderType).optional(),
    products: z.array(OrderProductSchema).optional(),
    price: z.number().min(0).optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    staffVerified: z.string().nullable().optional(),
    assignmentStatus: z.nativeEnum(AssignmentOrderStatus).optional(),
    staffId: z.string().nullable().optional(),
    assignStaff: z.string().nullable().optional(),
    assignedAt: z.date().nullable().optional(),
    startedAt: z.date().nullable().optional(),
    completedAt: z.date().nullable().optional(),
});

// Type exports
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;

// Client-specific schemas with additional fields
export const ClientCreateOrderSchema = CreateOrderSchema.extend({
    voucher: z.array(z.string()).optional(),
    paymentMethod: z.string(),
    shippingAddress: z.any().optional(),
    customerInfo: z.any().optional(),
    note: z.string().optional(),
});

export const ClientUpdateOrderSchema = UpdateOrderSchema.extend({
    voucher: z.array(z.string()).optional(),
    paymentMethod: z.string().optional(),
    shippingAddress: z.any().optional(),
    customerInfo: z.any().optional(),
    note: z.string().optional(),
});

// Client-specific type exports
export type ClientCreateOrder = z.infer<typeof ClientCreateOrderSchema>;
export type ClientUpdateOrder = z.infer<typeof ClientUpdateOrderSchema>;
