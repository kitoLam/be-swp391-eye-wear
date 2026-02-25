import z from 'zod';

export const ProductListQuerySchema = z.object({
    page: z.coerce.number().min(1).catch(1),
    limit: z.coerce.number().min(1).max(50).catch(10),
    type: z.enum(['frame', 'lens', 'sunglass']).optional(),
    brand: z.string().optional(),
    search: z.string().optional(),
    // Spec filters for frame/sunglass
    material: z.string().optional(),
    shape: z.string().optional(),
    gender: z.enum(['F', 'M', 'N']).optional(),
    style: z.string().optional(),
    // Spec filters for lens
    feature: z.string().optional(),
    origin: z.string().optional(),
    // General filters
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
