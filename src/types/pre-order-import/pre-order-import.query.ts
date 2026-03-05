import z from 'zod';

export const PreOrderImportQuerySchema = z.object({
    page: z.coerce.number().min(1).catch(1),
    limit: z.coerce.number().min(1).max(50).catch(10),
    sku: z.string().optional(),
    targetDate: z.string().optional(),
});

export type PreOrderImportQuery = z.infer<typeof PreOrderImportQuerySchema>;
