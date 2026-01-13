import z from 'zod';

// Payment Schema
export const PaymentSchema = z.object({
    _id: z.string().min(1, 'Payment ID is required'),
    owner_id: z.string().min(1, 'Owner ID is required'),
    invoice_id: z.string().min(1, 'Invoice ID is required'),
    payment_method: z.enum(['CASH', 'BANK']),
    status: z.enum(['PAID', 'UNPAID']),
    note: z.string().default(''),
    price: z.number().min(0, 'Price must be non-negative'),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),
});

// Create Payment Schema
export const CreatePaymentSchema = z.object({
    owner_id: z.string().min(1, 'Owner ID is required'),
    invoice_id: z.string().min(1, 'Invoice ID is required'),
    payment_method: z.enum(['CASH', 'BANK']),
    status: z.enum(['PAID', 'UNPAID']).default('UNPAID'),
    note: z.string().optional().default(''),
    price: z.number().min(0, 'Price must be non-negative'),
});

// Update Payment Schema
export const UpdatePaymentSchema = z.object({
    payment_method: z.enum(['CASH', 'BANK']).optional(),
    status: z.enum(['PAID', 'UNPAID']).optional(),
    note: z.string().optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;
