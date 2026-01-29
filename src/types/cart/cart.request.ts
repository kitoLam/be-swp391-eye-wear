import z from 'zod';
import { LensParametersSchema } from '../lens-parameters/lens-parameters';

// ================== Client Request ===================
export const CartItemBaseRequestSchema = z.object({
    product: z
        .object({
            product_id: z.string().min(1, 'Product ID is required'),
            sku: z.string().min(1, 'Product SKU is required'),
        }),
    lens: z
        .object({
            lens_id: z.string().min(1, 'Lens ID is required'),
            sku: z.string().min(1, 'Lens SKU is required'),
        })
        .optional(),
});
export const CartItemCreateSchema = z.object({
    product: z
        .object({
            product_id: z.string().min(1, 'Product ID is required'),
            sku: z.string().min(1, 'Product SKU is required'),
        }),
    lens: z
        .object({
            lens_id: z.string().min(1, 'Lens ID is required'),
            sku: z.string().min(1, 'Lens SKU is required'),
            parameters: LensParametersSchema
        })
        .optional(),
});
export const CartItemUpdateQuantitySchema = CartItemBaseRequestSchema.extend({
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});
// Add item to Cart Schema
export const AddItemToCartSchema = z.object({
    item: CartItemCreateSchema,
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// Update Cart Item Schema
export const UpdateCartItemQuantitySchema = z.object({
    item: CartItemBaseRequestSchema,
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});
export const UpdateCartItemPrescriptionSchema = z.object({
    item: CartItemBaseRequestSchema,
    parameters: LensParametersSchema,
});
export const RemoveCartItemSchema = z.object({
    item: CartItemBaseRequestSchema,
});

export type AddItemToCart = z.infer<typeof AddItemToCartSchema>;
export type UpdateCartItemQuantity = z.infer<
    typeof UpdateCartItemQuantitySchema
>;
export type UpdateCartItemPrescription = z.infer<
    typeof UpdateCartItemPrescriptionSchema
>;
export type CartItemBaseRequest = z.infer<typeof CartItemBaseRequestSchema>;
export type RemoveCartItem = z.infer<typeof RemoveCartItemSchema>;
export type CartItemCreate = z.infer<typeof CartItemCreateSchema>;
// ================== End Client Request ===================

// ================== Admin Request ======================
// ================== End Admin Request ===================
