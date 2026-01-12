import z from 'zod';

export const LenSpecSchema = z.object({
    feature: z.array(z.string()).min(1, 'At least one feature is required'),
    origin: z.string().min(1, 'Origin is required').nullable(),
});

export type LenSpec = z.infer<typeof LenSpecSchema>;
