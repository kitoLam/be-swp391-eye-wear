import z, { date } from 'zod';

export const ImportProductSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    quantity: z.number().min(1, 'Quantity is required'),
    staffResponsible: z.string().min(1, 'Staff responsible is required'),
    createdAt: date(),
    deletedAt: date().nullable(),
});

export const ImportProductRequestSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    quantity: z.number().min(1, 'Quantity is required'),
});

export type ImportProductRequest = z.infer<typeof ImportProductRequestSchema>;
export type ImportProduct = z.infer<typeof ImportProductSchema>;
