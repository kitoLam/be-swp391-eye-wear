import z from "zod";

export const SendProfileRequestSchema = z.object({
  name: z.string().nonempty({error: "Name is required"}),
  email: z.string().email({error: "Email is invalid"}),
  phone: z.string().length(10, {error: "Phone is required to be 10 digits"})
});
export type SendProfileRequestDTO = z.infer<typeof SendProfileRequestSchema>;

