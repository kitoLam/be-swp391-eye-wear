import { z } from 'zod';
import { Types } from 'mongoose';
import { RoleType } from '../../config/enums/admin-account';

export const AdminAccount = z.object({
    _id: z.instanceof(Types.ObjectId),
    citizenId: z.string(),
    name: z.string(),
    phone: z.string(),
    email: z.string(),
    hashedPassword: z.string(),
    avatar: z.string(),
    role: z.enum(RoleType),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    lastLogin: z.date().nullable(),
});

export const AdminAccountCreateSchema = z
    .object({
        name: z
            .string()
            .min(1, 'Admin name is required')
            .max(255, 'Admin name is max 255 character'),
        citizenId: z
            .string()
            .nonempty('CCCD is required')
            .regex(/^\d{12}$/, 'CitizenId is need to be at least 12 digits'),
        phone: z.string().nonempty('Phone number is required').regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g),
        email: z.string().nonempty('Email is required').email('Email is invalid'),
        password: z.string().nonempty('Password is required'),
        role: z.enum(RoleType, { error: 'Role is invalid' }),
        avatar: z.string(),
    })
    .strict();

export const AdminAccountUpdateSchema = AdminAccountCreateSchema;

export type AdminAccount = z.infer<typeof AdminAccount>;
export type AdminAccountCreateDTO = z.infer<typeof AdminAccountCreateSchema>;
export type AdminAccountUpdateDTO = z.infer<typeof AdminAccountUpdateSchema>;
