import z from 'zod';
import { OrderProductSchema } from './order-product';

// Verification Status Schema
export const VerificationStatusSchema = z.object({
    status: z.enum(['PENDING', 'APPROVE', 'REJECT']),
    staffVerified: z.string().optional(), // Staff ID who verified
});

// Assignment Schema
export const AssignmentSchema = z.object({
    staffId: z.string().optional(), // ID của nhân viên được giao làm đơn
    assignStaff: z.string().optional(), // Staff ID who assigned
    assignedAt: z.date().optional(),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED']),
});

// Order Schema
export const OrderSchema = z.object({
    _id: z.string().min(1, 'Order ID is required'),
    type: z.enum(['NORMAL', 'PRE-ORDER', 'MANUFACTURING']),
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    isVerified: VerificationStatusSchema.optional(),
    assignment: AssignmentSchema.optional(),
    price: z.number().min(0, 'Price must be non-negative'),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),
});

// Create Order Schema
export const CreateOrderSchema = z.object({
    type: z.enum(['NORMAL', 'PRE-ORDER', 'MANUFACTURING']),
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    isVerified: VerificationStatusSchema.optional(),
    assignment: AssignmentSchema.optional(),
    price: z.number().min(0, 'Price must be non-negative'),
});

// Update Order Schema
export const UpdateOrderSchema = z.object({
    type: z.enum(['NORMAL', 'PRE-ORDER', 'MANUFACTURING']).optional(),
    products: z.array(OrderProductSchema).optional(),
    isVerified: VerificationStatusSchema.optional(),
    assignment: AssignmentSchema.optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
});

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;

// Client Create Order Schema (Type is auto-calculated)
export const ClientCreateOrderSchema = z.object({
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    note: z.string().optional(),
});

export type ClientCreateOrder = z.infer<typeof ClientCreateOrderSchema>;
