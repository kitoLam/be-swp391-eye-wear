import z from 'zod';

// Linked Account Schema
export const LinkedAccountSchema = z.object({
    provider: z.string().min(1, 'Provider is required'),
    sub: z.string().min(1, 'Subject is required'),
    email_verified: z.boolean(),
    given_name: z.string().optional(),
    family_name: z.string().optional(),
    picture: z.string().url().optional(),
    locale: z.string().optional(),
    linkedAt: z.date(),
});

export type LinkedAccount = z.infer<typeof LinkedAccountSchema>;
