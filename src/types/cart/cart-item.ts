import z from 'zod';
import { LensParametersSchema } from '../lens-parameters/lens-parameters';

// Cart Item Schema
export const CartItemSchema = z.object({
    product: z.object({
        product_id: z.string().min(1, 'Product ID is required'),
        sku: z.string().min(1, 'Product SKU is required'),
    }),
    lens: z.object({
        lens_id: z.string().min(1, 'Lens ID is required'),
        sku: z.string().min(1, 'Lens SKU is required'),
        parameters: LensParametersSchema,
    }).optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    addAt: z.date(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
