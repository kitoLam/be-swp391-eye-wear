import z from "zod";

export const AIConversationListQuerySchema = z.object({
  lastItem: z.coerce.number().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
});

export type AIConversationListQuery = z.infer<typeof AIConversationListQuerySchema>;