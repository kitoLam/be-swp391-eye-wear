import z from 'zod';
import { LensParametersSchema } from '../lens-parameters/lens-parameters';

// Order Product Lens Schema
export const OrderProductLensSchema = z.object({
    lens_id: z.string().min(1, 'Lens ID is required'),
    parameters: LensParametersSchema,
    sku: z.string().min(1, 'SKU is required'),
    pricePerUnit: z.number(),
});
export const OrderProductFrameSchema = z.object({
    product_id: z.string().min(1, 'Frame ID is required').nonempty("product_id is required"),
    sku: z.string().min(1, 'SKU is required'),
    pricePerUnit: z.number(),
});
// Order Product Schema
export const OrderProductSchema = z.object({
    product: OrderProductFrameSchema,
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    lens: OrderProductLensSchema.optional(),
});
export const OrderProductClientUpdateSchema = z.object({
    product: OrderProductFrameSchema,
    lens: OrderProductLensSchema.optional(),
});
export const OrderProductClientCreateSchema = z.object({
    product: z.object({
        product_id: z.string().min(1, 'Frame ID is required').nonempty("product_id is required"),
        sku: z.string().min(1, 'SKU is required'),
    }),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    lens: z.object({
        lens_id: z.string().min(1, 'Lens ID is required'),
        parameters: LensParametersSchema,
        sku: z.string().min(1, 'SKU is required'),
    }).optional(),
});
export type OrderProductLens = z.infer<typeof OrderProductLensSchema>;
export type OrderProduct = z.infer<typeof OrderProductSchema>;
export type OrderProductClientUpdate = z.infer<typeof OrderProductClientUpdateSchema>;
export type OrderProductClientCreate = z.infer<typeof OrderProductClientCreateSchema>;