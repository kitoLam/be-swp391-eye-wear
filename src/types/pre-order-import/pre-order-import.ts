import z from 'zod';
import { PreOrderImportStatus } from '../../config/enums/pre-order-import.enum';

export const PreOrderImportSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    description: z.string().min(1, 'Description is required'),
    targetDate: z.date(),
    targetQuantity: z.number().min(1, 'Target quantity is required'),
    managerResponsibility: z
        .string()
        .min(1, 'Manager responsibility is required'),
    status: z.enum([
        PreOrderImportStatus.PENDING,
        PreOrderImportStatus.DONE,
        PreOrderImportStatus.CANCELLED,
    ]),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const PreOrderImportRequestSchema = z.object({
    sku: z.string().min(1, 'SKU is required'),
    description: z.string().min(1, 'Description is required'),
    targetDate: z.coerce.date(),
    targetQuantity: z.number().min(1, 'Target quantity is required'),
});

export type PreOrderImportRequest = z.infer<typeof PreOrderImportRequestSchema>;
export type PreOrderImport = z.infer<typeof PreOrderImportSchema>;
