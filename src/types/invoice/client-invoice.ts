import { z } from 'zod';
import { OrderProductSchema } from '../order/order-product';
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
export const ClientCreateInvoiceSchema = z.object({
    // Products to checkout
    products: z
        .array(OrderProductSchema)
        .min(1, 'At least one product is required'),

    // Payment method (required for inventory logic)
    paymentMethod: z.enum(PaymentMethodType),

    // Shipping information
    address: AddressSchema,
    fullName: z.string().min(1, 'Full name is required'),
    phone: z
        .string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number must not exceed 15 digits'),

    // Optional fields
    voucher: z.array(z.string()).optional().default([]),
    note: z.string().max(500, 'Note must not exceed 500 characters').optional(),
});

// Type export
export type ClientCreateInvoice = z.infer<typeof ClientCreateInvoiceSchema>;
