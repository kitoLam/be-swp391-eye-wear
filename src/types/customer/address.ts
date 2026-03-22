import z from 'zod';

// Address Schema
export const AddressSchema = z.object({
    street: z.string().min(1, 'Street is required').max(100),
    ward: z.string().min(1, 'Ward is required').max(100),
    city: z.string().min(1, 'City is required').max(100),
});

export type Address = z.infer<typeof AddressSchema>;
