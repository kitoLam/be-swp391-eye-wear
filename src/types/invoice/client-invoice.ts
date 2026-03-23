import { z } from 'zod';
import {
    OrderProductClientCreateSchema,
    OrderProductSchema,
} from '../order/order-product';
import { AddressSchema } from '../customer/address';
import { PaymentMethodType } from '../../config/enums/payment.enum';

/**
 * Client Create Invoice Schema
 * Used for checkout requests from frontend
 *
 * Key differences from internal InvoiceSchema:
 * - Accepts `products` array instead of `orders` (orders are created by backend)
 * - Requires `paymentMethod` for inventory management (COD vs Online)
 * - Does NOT accept `totalPrice` or `totalDiscount` (calculated server-side for security)
 */
export const ClientCreateInvoiceSchema = z
    .object({
        // Products to checkout
        products: z
            .array(OrderProductClientCreateSchema)
            .min(1, 'At least one product is required'),

        // Payment method (required for inventory logic)
        paymentMethod: z.enum(PaymentMethodType),

        // Shipping information
        address: AddressSchema,
        fullName: z
            .string()
            .min(1, 'Full name is required')
            .max(50)
            .regex(/^[\p{L}\s]+$/u, 'Name must only contain letters'),
        phone: z
            .string()
            .min(1, 'Phone number is required')
            .regex(
                /^(0[2|3|5|7|8|9])+([0-9]{8})$/,
                'Invalid Vietnamese phone number format'
            ),

        // Optional fields
        voucher: z.array(z.string()).optional().default([]),
        note: z
            .string()
            .max(500, 'Note must not exceed 500 characters')
            .optional(),
    })
    .strict();
export const ClientUpdateInvoiceSchema = z
    .object({
        address: AddressSchema,
        fullName: z
            .string()
            .min(1, 'Full name is required')
            .max(50)
            .regex(/^[\p{L}\s]+$/u, 'Name must only contain letters'),
        phone: z
            .string()
            .min(1, 'Phone number is required')
            .regex(
                /^(0[2|3|5|7|8|9])+([0-9]{8})$/,
                'Invalid Vietnamese phone number format'
            ),
        note: z
            .string()
            .max(500, 'Note must not exceed 500 characters')
            .optional(),
    })
    .strict();
// Type export
export type ClientCreateInvoice = z.infer<typeof ClientCreateInvoiceSchema>;
export type ClientUpdateInvoice = z.infer<typeof ClientUpdateInvoiceSchema>;
