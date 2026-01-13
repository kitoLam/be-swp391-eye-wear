import z from 'zod';

// Cart Item Schema
export const CartItemSchema = z.object({
    product_id: z.string().min(1, 'Product ID (SKU) is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    addAt: z.date(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
