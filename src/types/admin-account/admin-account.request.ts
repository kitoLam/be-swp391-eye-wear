import z from "zod";
import { RoleType } from "../../config/enums/admin-account";


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
        password: z.string().nonempty('Password is required').min(8, 'Password must be at least 8 characters'),
        role: z.enum(RoleType, { error: 'Role is invalid' }),
        avatar: z.string().nullable(),
    })
    .strict();

export const AdminAccountUpdateSchema = z
    .object({
        name: z
            .string()
            .max(255, 'Admin name is max 255 character')
            .optional(),
        citizenId: z
            .string()
            .regex(/^\d{12}$/, 'CitizenId is need to be at least 12 digits')
            .optional(),
        phone: z
            .string()
            .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g)
            .optional(),
        email: z.string().email('Email is invalid').optional(),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .optional(),
        role: z.enum(RoleType, { error: 'Role is invalid' }).optional(),
        avatar: z.string().nullable().optional(),
    })
    .strict();

export type AdminAccountCreateDTO = z.infer<typeof AdminAccountCreateSchema>;
export type AdminAccountUpdateDTO = z.infer<typeof AdminAccountUpdateSchema>;
