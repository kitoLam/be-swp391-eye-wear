import z from 'zod';
import { PaymentMethodType } from '../../config/enums/payment.enum';

// Payment Schema
export const PaymentSchema = z.object({
    _id: z.string().min(1, 'Payment ID is required'),
    ownerId: z.string().min(1, 'Owner ID is required'),
    invoiceId: z.string().min(1, 'Order ID is required'),
    paymentMethod: z.enum(PaymentMethodType, {error: "Payment method is required"}),
    status: z.enum(['PAID', 'UNPAID']),
    note: z.string().default(''),
    price: z.number(), // Có thể là số âm cho đơn hoàn tiền
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),
});

// Create Payment Schema
export const CreatePaymentSchema = z.object({
    ownerId: z.string().min(1, 'Owner ID is required'),
    orderId: z.string().min(1, 'Order ID is required'),
    paymentMethod: z.enum(['CASH', 'BANK']),
    status: z.enum(['PAID', 'UNPAID']).default('UNPAID'),
    note: z.string().optional().default(''),
    price: z.number(), // Có thể là số âm cho đơn hoàn tiền
});

// Update Payment Schema
export const UpdatePaymentSchema = z.object({
    payment_method: z.enum(['CASH', 'BANK']).optional(),
    status: z.enum(['PAID', 'UNPAID']).optional(),
    note: z.string().optional(),
    price: z.number().optional(), // Có thể là số âm cho đơn hoàn tiền
});

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;
