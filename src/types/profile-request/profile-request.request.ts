import z from "zod";

export const SendProfileRequestSchema = z.object({
  name: z.string().nonempty({error: "Name is required"}).max(50, { error: "Name can only have 50 char max length"}).regex(/^[a-zA-Z\s]+$/, 'Name must only contain letters'),
  email: z.string().email({error: "Email is invalid"}),
  phone: z.string().nonempty('Phone number is required').regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g)
}).strict();
export type SendProfileRequestDTO = z.infer<typeof SendProfileRequestSchema>;

