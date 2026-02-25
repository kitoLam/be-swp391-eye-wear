import { z } from 'zod';
import { BaseQuerySchema } from '../common/base-query';

export const CustomerListQuerySchema = BaseQuerySchema.extend({
    search: z.string().optional(),
    gender: z.enum(['F', 'M', 'N']).optional(),
});

export type CustomerListQuery = z.infer<typeof CustomerListQuerySchema>;
