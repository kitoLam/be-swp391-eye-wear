import z from 'zod';

// Lens Parameters Schema
export const LensParametersSchema = z.object({
    left: z.object({
        SPH: z.number().min(-20).max(20),
        CYL: z.number().min(-20).max(20),
        AXIS: z.number().min(0).max(180), 
        ADD: z.number().min(0.75).max(3.5)
    }),
    right: z.object({
        SPH: z.number().min(-20).max(20),
        CYL: z.number().min(-20).max(20),
        AXIS: z.number().min(0).max(180),
        ADD: z.number().min(0.75).max(3.5)
    }),
    PD: z.number().min(35).max(65),
});

export type LensParameters = z.infer<typeof LensParametersSchema>;
