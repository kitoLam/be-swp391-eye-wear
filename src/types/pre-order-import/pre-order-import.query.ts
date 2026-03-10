import z from 'zod';
import { PreOrderImportStatus } from '../../config/enums/pre-order-import.enum';

export const PreOrderImportQuerySchema = z.object({
    page: z.coerce.number().min(1).catch(1),
    limit: z.coerce.number().min(1).max(50).catch(10),
    sku: z.string().optional(),
    targetDate: z.string().optional(),
    status: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform(val => (Array.isArray(val) ? val : val ? [val] : undefined)),
});

export type PreOrderImportQuery = z.infer<typeof PreOrderImportQuerySchema>;
