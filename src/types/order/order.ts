import z from 'zod';
import { OrderProductSchema } from './order-product';
import {
    AssignmentOrderStatus,
    OrderStatus,
    OrderType,
} from '../../config/enums/order.enum';
import { LensParametersSchema } from './lens-parameters';

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

// Update Order Schema
export const UpdateOrderSchema = z.object({
    type: z.enum(OrderType).optional(),
    products: z.array(OrderProductSchema).optional(),
    price: z.number().min(0).optional(),
    status: z.enum(OrderStatus).optional(),
    staffVerified: z.string().nullable().optional(),
    assignmentStatus: z.enum(AssignmentOrderStatus).optional(),
    staffId: z.string().nullable().optional(),
    assignStaff: z.string().nullable().optional(),
    assignedAt: z.date().nullable().optional(),
    startedAt: z.date().nullable().optional(),
    completedAt: z.date().nullable().optional(),
});

// Type exports
export type Order = z.infer<typeof OrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;

export const ClientUpdateOrderPrescriptionSchema = z.object({
    invoiceId: z.string().nonempty('Invoice ID is required'),
    lensParameter: LensParametersSchema,
});

// Client-specific type exports
export type ClientUpdateOrder = z.infer<typeof ClientUpdateOrderPrescriptionSchema>;
