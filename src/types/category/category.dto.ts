import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Zod schema for creating a new category
 */
export const CreateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    parentId: z
        .string()
        .refine(value => Types.ObjectId.isValid(value), "parentId is not valid")
        .nullable(),
}).strict();

/**
 * Zod schema for updating a category
 */
export const UpdateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    parentId: z
        .string()
        .refine(value => Types.ObjectId.isValid(value), "parentId is not valid")
        .nullable(),
    // thumbnail: z.string().nullable()
}).strict();

export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;
