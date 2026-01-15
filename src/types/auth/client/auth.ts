import z from 'zod';

// Login DTO
export const LoginCustomerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// Register DTO (same as CreateCustomer but for clarity)
export const RegisterCustomerSchema = z.object({
    name: z.string().min(5, 'Name is required at least 5 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(1, 'Phone number is required').refine((value: string) => /(84|0[3|5|7|8|9])+([0-9]{8})\b/g.test(value), 'Invalid phone number format'),
    gender: z.enum(['F', 'M', 'N'], "Please choose a gender!"),
}).strict();

export type LoginCustomerDTO = z.infer<typeof LoginCustomerSchema>;
export type RegisterCustomerDTO = z.infer<typeof RegisterCustomerSchema>;
