import z from 'zod';

export const BaseQuerySchema = z.object({
    limit: z.number().min(1).max(1000).default(10),
    page: z.number().min(1).default(1),
});

