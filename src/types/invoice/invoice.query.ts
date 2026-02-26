import z from 'zod';
import { InvoiceStatus } from '../../config/enums/invoice.enum';

export const InvoiceListQuerySchema = z.object({
    page: z.coerce.number().min(1).catch(1),
    limit: z.coerce.number().min(1).max(1000).catch(10),
    status: z.enum(InvoiceStatus).optional().catch(undefined),
    invoiceCode: z.string().optional().catch(undefined),
    statuses: z
        .union([
            z.array(z.enum(InvoiceStatus)),
            z.string().transform(value =>
                value
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
            ),
        ])
        .optional()
        .transform(value => {
            if (!value) return undefined;
            const arr = Array.isArray(value) ? value : value;
            return arr.length ? arr : undefined;
        })
        .refine(
            value =>
                !value ||
                value.every(s =>
                    (Object.values(InvoiceStatus) as string[]).includes(s)
                ),
            {
                message: 'Invalid statuses',
            }
        )
        .catch(undefined),
    search: z.string().optional().catch(undefined),
});
export type InvoiceListQuery = z.infer<typeof InvoiceListQuerySchema>;
