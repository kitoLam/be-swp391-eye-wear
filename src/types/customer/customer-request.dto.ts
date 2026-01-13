import z from 'zod';

// Login DTO
export const LoginCustomerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// Register DTO (same as CreateCustomer but for clarity)
export const RegisterCustomerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(1, 'Phone number is required'),
    gender: z.enum(['F', 'M', 'N']),
});

export type LoginCustomer = z.infer<typeof LoginCustomerSchema>;
export type RegisterCustomer = z.infer<typeof RegisterCustomerSchema>;
