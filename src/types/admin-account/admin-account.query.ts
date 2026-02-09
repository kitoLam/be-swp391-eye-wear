import { z } from 'zod';
import { RoleType } from '../../config/enums/admin-account';
import { BaseQuerySchema } from '../common/base-query';

export const AdminAccountListQuerySchema = BaseQuerySchema.extend({
    role: z.nativeEnum(RoleType).optional(),
    search: z.string().optional(),
});

export type AdminAccountListQuery = z.infer<typeof AdminAccountListQuerySchema>;
