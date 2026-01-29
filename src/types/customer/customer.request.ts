import z from "zod";
import { AddressSchema } from "./address";

export const UpdateCustomerProfileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    gender: z.enum(['F', 'M', 'N']),
    address: z.array(AddressSchema),
    hobbies: z.array(z.string()).optional()
});

export type UpdateCustomerProfileRequest = z.infer<typeof UpdateCustomerProfileSchema>;