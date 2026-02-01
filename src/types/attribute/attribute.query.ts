import z from 'zod';

export const AttributeListQuerySchema = z.object({
    page: z.coerce.number().min(1).catch(1),
    limit: z.coerce.number().min(1).max(1000).catch(10),
});

export type AttributeListQuery = z.infer<typeof AttributeListQuerySchema>;
