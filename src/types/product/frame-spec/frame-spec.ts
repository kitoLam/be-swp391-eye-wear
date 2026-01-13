import z from 'zod';

export const FrameSpecSchema = z.object({
    material: z.array(z.string()).min(1, 'At least one material is required'),
    shape: z.string().min(1, 'Shape is required'),
    style: z.string().nullable(),
    gender: z.enum(['F', 'M', 'N']),
    weight: z.number().positive('Weight must be a positive number').nullable(),
    dimensions: z
        .object({
            width: z.number().positive('Width must be a positive number'),
            height: z.number().positive('Height must be a positive number'),
            depth: z.number().positive('Depth must be a positive number'),
        })
        .nullable(),
});

export type FrameSpec = z.infer<typeof FrameSpecSchema>;
