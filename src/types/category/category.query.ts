import z from "zod";

export const CategoryListQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  page: z.number().min(1).default(1),
  search: z.string().optional(),
  parentId: z.string().nullable().optional().catch(undefined),
});

export type CategoryListQuery = z.infer<typeof CategoryListQuerySchema>;