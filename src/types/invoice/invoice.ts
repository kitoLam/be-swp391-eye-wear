import z from 'zod';
import { AddressSchema } from '../customer/address';
import { InvoiceStatus } from '../../config/enums/invoice.enum';

// Invoice Schema
export const InvoiceSchema = z
    .object({
        _id: z.string(),
        orders: z.array(z.string()).min(1, 'At least one order is required'),
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
        manager_onboard: z.string(), // Manager ID when status is ONBOARD
        staffVerified: z.string().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
        deletedAt: z.date().nullable(),
    })
    .refine(data => data.totalDiscount <= data.totalPrice, {
        message: 'Total discount cannot exceed total price',
        path: ['totalDiscount'],
    });

// Create Invoice Schema
export const CreateInvoiceSchema = z
    .object({
        orders: z.array(z.string()).min(1, 'At least one order is required'),
        owner: z.string().min(1, 'Owner ID is required'),
        totalPrice: z.number().min(0, 'Total price must be non-negative'),
        voucher: z.array(z.string()).default([]),
        address: AddressSchema,
        status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.PENDING),
        fullName: z.string().min(1, 'Full name is required'),
        phone: z.string().min(1, 'Phone number is required'),
        totalDiscount: z.number().min(0).default(0),
        manager_onboard: z.string().optional(),
    })
    .refine(data => data.totalDiscount <= data.totalPrice, {
        message: 'Total discount cannot exceed total price',
        path: ['totalDiscount'],
    });

// Update Invoice Schema
export const UpdateInvoiceSchema = z
    .object({
        orders: z.array(z.string()).optional(),
        totalPrice: z.number().min(0).optional(),
        voucher: z.array(z.string()).optional(),
        address: AddressSchema.optional(),
        status: z.nativeEnum(InvoiceStatus).optional(),
        fullName: z.string().optional(),
        phone: z.string().optional(),
        totalDiscount: z.number().min(0).optional(),
        manager_onboard: z.string().optional(),
    })
    .refine(
        data => {
            if (
                data.totalDiscount !== undefined &&
                data.totalPrice !== undefined
            ) {
                return data.totalDiscount <= data.totalPrice;
            }
            return true;
        },
        {
            message: 'Total discount cannot exceed total price',
            path: ['totalDiscount'],
        }
    );

// Type exports
export type Invoice = z.infer<typeof InvoiceSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;
