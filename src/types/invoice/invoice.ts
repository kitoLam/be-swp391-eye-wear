import z from 'zod';
import { AddressSchema } from '../customer/address';
import { InvoiceStatus } from '../../config/enums/invoice.enum';

// Invoice Schema
export const InvoiceSchema = z
    .object({
        _id: z.string(),
        invoiceCode: z.string(),
        owner: z.string().min(1, 'Owner ID is required'),
        totalPrice: z.number().min(0, 'Total price must be non-negative'),
        voucher: z.array(z.string()).min(0).default([]),
        address: AddressSchema,
        status: z.enum(InvoiceStatus),
        fullName: z.string().min(1, 'Full name is required'),
        phone: z.string().min(1, 'Phone number is required'),
        totalDiscount: z
            .number()
            .min(0, 'Total discount must be non-negative')
            .default(0),
        managerOnboard: z.string().nullable(), // Manager ID when status is ONBOARD
        staffVerified: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
        deletedAt: z.date().nullable(),
        note: z.string(),
    })
    .refine(data => data.totalDiscount <= data.totalPrice, {
        message: 'Total discount cannot exceed total price',
        path: ['totalDiscount'],
    });

// Type exports
export type Invoice = z.infer<typeof InvoiceSchema>;