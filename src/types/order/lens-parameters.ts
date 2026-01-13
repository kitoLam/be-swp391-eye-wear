import z from 'zod';

// Lens Parameters Schema
export const LensParametersSchema = z.object({
    left: z.object({
        SPH: z.number(),
        CYL: z.number(),
        AXIS: z.number(),
    }),
    right: z.object({
        SPH: z.number(),
        CYL: z.number(),
        AXIS: z.number(),
    }),
    PD: z.number(),
});

export type LensParameters = z.infer<typeof LensParametersSchema>;
