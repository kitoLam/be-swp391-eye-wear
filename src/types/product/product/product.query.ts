import z from 'zod';

export const ProductListQuerySchema = z.object({
    page: z.coerce.number().min(1).catch(1),
    limit: z.coerce.number().min(1).max(50).catch(10),
    type: z.enum(['frame', 'lens']).optional(),
    brand: z.string().optional(),
    search: z.string().optional(),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
