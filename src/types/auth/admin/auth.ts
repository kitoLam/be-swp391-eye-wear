import z from "zod";

const LoginBodySchema = z.object({
  email: z.string().nonempty("Email is required").email("Email is invalid"),
  password: z.string().nonempty("Password is required").min(8, "Password must be at least 8 characters"),
}).strict();

export type LoginBodyDTO = z.infer<typeof LoginBodySchema>;

export default LoginBodySchema;
