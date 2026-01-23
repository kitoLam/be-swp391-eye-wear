import z from 'zod';
import { OrderProductClientUpdateSchema, OrderProductSchema } from './order-product';
import { AddressSchema } from '../customer/address';
import { PaymentMethodType } from '../../config/enums/payment.enum';
import { AssignmentOrderStatus } from '../../config/enums/order.enum';

// Verification Status Schema
export const VerificationStatusSchema = z.object({
    status: z.enum(['PENDING', 'APPROVE', 'REJECT']),
    staffVerified: z.string().nullable(), // Staff ID who verified
});

// Assignment Schema
export const AssignmentSchema = z.object({
    staffId: z.string().nullable(), // ID của nhân viên được giao làm đơn
    assignStaff: z.string().nullable(), // Staff ID who assigned
    assignedAt: z.date().nullable(),
    startedAt: z.date().nullable(),
    completedAt: z.date().nullable(),
    status: z.enum(AssignmentOrderStatus),
});

// Payment Schema
export const PaymentSchema = z.object({
    totalPrice: z.number().min(0, 'Total price must be non-negative'),
    totalDiscount: z.number().min(0).default(0),
    finalPrice: z.number().min(0),
    voucher: z.array(z.string()).default([]),
});

// Customer Info Schema
export const CustomerInfoSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(1, 'Phone number is required'),
});

// Order Schema
export const OrderSchema = z.object({
    _id: z.string().min(1, 'Order ID is required'),
    owner: z.string().min(1, 'Owner ID is required'), // Added owner
    type: z.enum(['NORMAL', 'PRE-ORDER', 'MANUFACTURING']),
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    orderCode: z.string().nonempty(),
    
    shippingAddress: AddressSchema,
    customerInfo: CustomerInfoSchema,
    payment: PaymentSchema,

    isVerified: VerificationStatusSchema,
    assignment: AssignmentSchema,

    note: z.string(),

    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

// Create Order Schema (Internal/Full)
export const CreateOrderSchema = z.object({
    owner: z.string().min(1, 'Owner ID is required'),
    type: z.enum(['NORMAL', 'PRE-ORDER', 'MANUFACTURING']),
    products: z.array(OrderProductSchema).min(1),
    shippingAddress: AddressSchema,
    customerInfo: CustomerInfoSchema,
    payment: PaymentSchema,
    isVerified: VerificationStatusSchema.optional(),
    assignment: AssignmentSchema.optional(),
    note: z.string().optional(),
});

// Update Order Schema
export const UpdateOrderSchema = z.object({
    type: z.enum(['NORMAL', 'PRE-ORDER', 'MANUFACTURING']).optional(),
    products: z.array(OrderProductSchema).optional(),
    shippingAddress: AddressSchema.optional(),
    customerInfo: CustomerInfoSchema.optional(),
    payment: PaymentSchema.optional(),
    isVerified: VerificationStatusSchema.optional(),
    assignment: AssignmentSchema.optional(),
    note: z.string().optional(),
});

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrder = z.infer<typeof UpdateOrderSchema>;

// Client Create Order Schema
export const ClientCreateOrderSchema = z.object({
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),
    shippingAddress: AddressSchema,
    customerInfo: CustomerInfoSchema,
    voucher: z.array(z.string()).min(0),
    paymentMethod: z.enum(PaymentMethodType, {error: "Payment method is required"}),
    note: z.string(),
});

export const ClientUpdateOrderSchema = z.object({
    shippingAddress: AddressSchema,
    customerInfo: CustomerInfoSchema,
    products: z.array(OrderProductClientUpdateSchema).min(1), 
});
export type ClientCreateOrder = z.infer<typeof ClientCreateOrderSchema>;
export type ClientUpdateOrder = z.infer<typeof ClientUpdateOrderSchema>;
