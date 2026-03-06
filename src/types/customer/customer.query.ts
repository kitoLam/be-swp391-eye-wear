import { z } from 'zod';
import { BaseQuerySchema } from '../common/base-query';

export const CustomerListQuerySchema = BaseQuerySchema.extend({
    search: z.string().optional(),
    gender: z.enum(['F', 'M', 'N']).optional(),
});

export type CustomerListQuery = z.infer<typeof CustomerListQuerySchema>;

export const CustomerBySpendingQuerySchema = BaseQuerySchema.extend({
    spendingAmount: z.string().regex(/^\d+$/, 'spendingAmount must be a positive number').or(z.number().int()).transform(Number),
});

export type CustomerBySpendingQuery = z.infer<typeof CustomerBySpendingQuerySchema>;
