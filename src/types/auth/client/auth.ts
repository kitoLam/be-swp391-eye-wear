import z from 'zod';

// Login DTO
export const LoginCustomerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// Register DTO (same as CreateCustomer but for clarity)
export const RegisterCustomerSchema = z.object({
    name: z.string().min(5, 'Name is required at least 5 characters').max(50).regex(/^[\p{L}\s]+$/u, 'Name must only contain letters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z
                .string()
                .min(1, 'Phone number is required')
                .regex(
                    /^(0[2|3|5|7|8|9])+([0-9]{8})$/,
                    'Invalid Vietnamese phone number format'
                ),
    gender: z.enum(['F', 'M', 'N'], "Please choose a gender!"),
}).strict();

export const ForgetPasswordSchema = z.object({
    email: z.string().email('Invalid email format'),
});

export const VerifyOTPSchema = z.object({
    email: z.string().email('Invalid email format'),
    otp: z.string().length(4, 'OTP must be 4 characters'),
});

export const ResetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginCustomerDTO = z.infer<typeof LoginCustomerSchema>;
export type RegisterCustomerDTO = z.infer<typeof RegisterCustomerSchema>;
export type ForgetPasswordDTO = z.infer<typeof ForgetPasswordSchema>;
export type VerifyOTP = z.infer<typeof VerifyOTPSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;