import { Types } from "mongoose";
import z from "zod";

/**
 * Zod schema for Categories validation
 */
export const CategorySchema = z.object({
    _id: z.instanceof(Types.ObjectId),
    name: z.string().min(1, 'Category name is required'),
    parentCate: z.instanceof(Types.ObjectId).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    deletedBy: z.string().or(z.instanceof(Types.ObjectId)).nullable(),
    createdBy: z.string().or(z.instanceof(Types.ObjectId)).nullable(),
    thumbnail: z.string().nullable(),
});
export type Category = z.infer<typeof CategorySchema>;
