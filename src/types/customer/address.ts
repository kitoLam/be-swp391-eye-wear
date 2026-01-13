import z from 'zod';

// Address Schema
export const AddressSchema = z.object({
    no: z.string().min(1, 'Address number is required'),
    ward: z.string().min(1, 'Ward is required'),
    city: z.string().min(1, 'City is required'),
});

export type Address = z.infer<typeof AddressSchema>;
