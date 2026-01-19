import { z } from 'zod';

/**
 * Schema cho response của Product trong danh sách
 */
export const StandardProductSchema = z.object({
    id: z.string(),
    nameBase: z.string(),
    slugBase: z.string(),
    skuBase: z.string(),
    type: z.enum(['frame', 'lens', 'sunglass']),
    brand: z.string().nullable(),
    categories: z.array(z.string()),
    defaultVariantPrice: z.number().optional(),
    defaultVariantFinalPrice: z.number().optional(),
    defaultVariantImage: z.string().optional(),
    totalVariants: z.number(),
    createdAt: z.string(),
});

export type StandardProduct = z.infer<typeof StandardProductSchema>;
