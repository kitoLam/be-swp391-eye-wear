import z from 'zod';
import { LensParametersSchema } from './lens-parameters';

// Order Product Lens Schema
export const OrderProductLensSchema = z.object({
    lens_id: z.string().min(1, 'Lens ID is required'),
    parameters: LensParametersSchema,
    // Quantity của lens thường đi theo cặp hoặc bằng sl gọng, nhưng ở đây có thể optional hoặc required tùy business.
    // Giữ nguyên quantity cho lens nếu lens tracking riêng.
    quantity: z
        .number()
        .int()
        .min(1, 'Quantity must be at least 1')
        .optional()
        .default(1),
});

// Order Product Schema
export const OrderProductSchema = z.object({
    product_id: z.string().min(1, 'Product ID is required'),

    quantity: z.number().int().min(1, 'Quantity must be at least 1'),

    lens: OrderProductLensSchema.optional(), // Lens is now OPTIONAL
});

export type OrderProductLens = z.infer<typeof OrderProductLensSchema>;
export type OrderProduct = z.infer<typeof OrderProductSchema>;
