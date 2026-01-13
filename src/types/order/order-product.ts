import z from 'zod';
import { LensParametersSchema } from './lens-parameters';

// Order Product Lens Schema
export const OrderProductLensSchema = z.object({
    lens_id: z.string().min(1, 'Lens ID is required'),
    parameters: LensParametersSchema,
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// Order Product Schema
export const OrderProductSchema = z.object({
    frames: z.string().min(1, 'Frame ID is required'),
    lens: OrderProductLensSchema,
});

export type OrderProductLens = z.infer<typeof OrderProductLensSchema>;
export type OrderProduct = z.infer<typeof OrderProductSchema>;
