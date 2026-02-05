import z from "zod";

export const LoginBodySchema = z.object({
  email: z.string().nonempty("Email is required").email("Email is invalid"),
  password: z.string().nonempty("Password is required").min(8, "Password must be at least 8 characters"),
}).strict();

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().nonempty("Password is required").min(8, "Password must be at least 8 characters"),
  newPassword: z.string().nonempty("Password is required").min(8, "Password must be at least 8 characters"),
})

export type LoginBodyDTO = z.infer<typeof LoginBodySchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;