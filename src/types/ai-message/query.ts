import z from "zod";

export const AIMessageListQuerySchema = z.object({
  lastMessageAt: z.coerce.number().optional().catch(undefined),
});

export type AIMessageListQuery = z.infer<typeof AIMessageListQuerySchema>;