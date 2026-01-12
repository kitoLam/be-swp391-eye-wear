import { z } from 'zod';
import { Types } from 'mongoose';

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
});

/**
 * Zod schema for creating a new category
 */
export const CreateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    parentCate: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format')
        .nullable(),
});

/**
 * Zod schema for updating a category
 */
export const UpdateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    parentCate: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format')
        .nullable(),
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
