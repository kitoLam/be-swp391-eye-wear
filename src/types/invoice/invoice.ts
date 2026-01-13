import z from 'zod';
import { AddressSchema } from '../customer/address';

// Invoice Schema
export const InvoiceSchema = z.object({
    _id: z.string().min(1, 'Invoice ID is required'),
    orders: z
        .array(z.string().min(1, 'Order ID is required'))
        .min(1, 'At least one order is required'),
    owner: z.string().min(1, 'Owner ID is required'),
    totalPrice: z.number().min(0, 'Total price must be non-negative'),
    voucher: z.array(z.string()).default([]),
    address: AddressSchema,
    status: z.enum(['PENDING', 'DEPOSITED', 'PAIDED', 'COMPLETE']),
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    totalDiscount: z
        .number()
        .min(0, 'Total discount must be non-negative')
        .default(0),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),
});

// Create Invoice Schema
export const CreateInvoiceSchema = z.object({
    orders: z
        .array(z.string().min(1, 'Order ID is required'))
        .min(1, 'At least one order is required'),
    owner: z.string().min(1, 'Owner ID is required'),
    totalPrice: z.number().min(0, 'Total price must be non-negative'),
    voucher: z.array(z.string()).optional().default([]),
    address: AddressSchema,
    status: z
        .enum(['PENDING', 'DEPOSITED', 'PAIDED', 'COMPLETE'])
        .default('PENDING'),
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    totalDiscount: z
        .number()
        .min(0, 'Total discount must be non-negative')
        .optional()
        .default(0),
});

// Update Invoice Schema
export const UpdateInvoiceSchema = z.object({
    totalPrice: z
        .number()
        .min(0, 'Total price must be non-negative')
        .optional(),
    voucher: z.array(z.string()).optional(),
    address: AddressSchema.optional(),
    status: z.enum(['PENDING', 'DEPOSITED', 'PAIDED', 'COMPLETE']).optional(),
    fullName: z.string().min(1, 'Full name is required').optional(),
    phone: z.string().min(1, 'Phone number is required').optional(),
    totalDiscount: z
        .number()
        .min(0, 'Total discount must be non-negative')
        .optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;
