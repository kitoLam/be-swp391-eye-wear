import z from "zod";

export const AIMessageListQuerySchema = z.object({
  lastMessageAt: z.coerce.number().optional().catch(undefined),
});
export const AIMessageListQueryByAdminSchema = z.object({
  lastItem: z.coerce.number().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
});

export type AIMessageListQuery = z.infer<typeof AIMessageListQuerySchema>;
export type AIMessageListQueryByAdmin = z.infer<typeof AIMessageListQueryByAdminSchema>;