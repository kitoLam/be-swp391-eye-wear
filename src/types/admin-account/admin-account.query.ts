import { z } from 'zod';
import { RoleType } from '../../config/enums/admin-account';

export const AdminAccountListQuerySchema = z.object({
    role: z.nativeEnum(RoleType).optional(),
});

export type AdminAccountListQuery = z.infer<typeof AdminAccountListQuerySchema>;

