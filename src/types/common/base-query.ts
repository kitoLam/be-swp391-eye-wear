import z from 'zod';

export const BaseQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(1000).catch(10),
    page: z.coerce.number().min(1).catch(1),
});

