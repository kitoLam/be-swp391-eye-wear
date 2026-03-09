import z from 'zod';
import { InvoiceStatus } from '../../config/enums/invoice.enum';

export enum InvoiceRevenuePeriod {
    YEAR = 'year',
    MONTH = 'month',
    WEEK = 'week',
    DAY = 'day',
}

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
export const InvoiceRevenueQuerySchema = z
    .object({
        period: z.nativeEnum(InvoiceRevenuePeriod).catch(
            InvoiceRevenuePeriod.DAY
        ),
        fromDate: z.string().datetime().optional().catch(undefined),
        toDate: z.string().datetime().optional().catch(undefined),
    })
    .refine(
        data =>
            !data.fromDate ||
            !data.toDate ||
            new Date(data.fromDate) <= new Date(data.toDate),
        {
            message: 'fromDate must be less than or equal to toDate',
            path: ['fromDate'],
        }
    );

export type InvoiceListQuery = z.infer<typeof InvoiceListQuerySchema>;
export type InvoiceRevenueQuery = z.infer<typeof InvoiceRevenueQuerySchema>;
