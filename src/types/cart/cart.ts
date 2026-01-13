import z from 'zod';
import { CartItemSchema } from './cart-item';

// Cart Schema
export const CartSchema = z.object({
    _id: z.string().min(1, 'Cart ID is required'),
    owner: z.string().min(1, 'Owner ID is required'),
    products: z.array(CartItemSchema).default([]),
    totalProduct: z
        .number()
        .int()
        .min(0, 'Total product must be non-negative')
        .default(0),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),
});

// Create Cart Schema (for creating new cart)
export const CreateCartSchema = z.object({
    owner: z.string().min(1, 'Owner ID is required'),
    products: z.array(CartItemSchema).optional().default([]),
    totalProduct: z.number().int().min(0).optional().default(0),
});

// Update Cart Schema (for updating cart)
export const UpdateCartSchema = z.object({
    products: z.array(CartItemSchema).optional(),
    totalProduct: z.number().int().min(0).optional(),
});

// Add to Cart Schema
export const AddToCartSchema = z.object({
    product_id: z.string().min(1, 'Product ID (SKU) is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// Update Cart Item Schema
export const UpdateCartItemSchema = z.object({
    product_id: z.string().min(1, 'Product ID (SKU) is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export type Cart = z.infer<typeof CartSchema>;
export type CreateCart = z.infer<typeof CreateCartSchema>;
export type UpdateCart = z.infer<typeof UpdateCartSchema>;
export type AddToCart = z.infer<typeof AddToCartSchema>;
export type UpdateCartItem = z.infer<typeof UpdateCartItemSchema>;
