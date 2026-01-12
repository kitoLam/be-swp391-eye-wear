import { z } from 'zod';

export const IUser = z.object({
    username: z.string(),
    password: z.string(),
});

export const registerUser = IUser.extend({
    phone: z.string(),
    email: z.string().email(),
});

export const fullUser = registerUser.extend({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export type User = z.infer<typeof IUser> | z.infer<typeof registerUser>;
export type FullUser = z.infer<typeof fullUser>;
