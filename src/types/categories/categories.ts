import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Zod schema for Categories validation
 */
export const CategorySchema = z.object({
    _id: z.instanceof(Types.ObjectId),
    name: z.string().min(1, 'Category name is required'),
    type: z.enum(['frame', 'lens']),
    parentCate: z.instanceof(Types.ObjectId).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    deletedBy: z.string().or(z.instanceof(Types.ObjectId)).nullable(),
    createdBy: z.string().or(z.instanceof(Types.ObjectId)).nullable(),
    thumbnail: z.string().nullable(),
});

/**
 * Zod schema for creating a new category
 */
export const CreateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    type: z.enum(['frame', 'lens']),
    parentId: z
        .string()
        .refine(value => Types.ObjectId.isValid(value), "parentId is not valid")
        .nullable(),
});

/**
 * Zod schema for updating a category
 */
export const UpdateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    type: z.enum(['frame', 'lens']),
    parentId: z
        .string()
        .refine(value => Types.ObjectId.isValid(value), "parentId is not valid")
        .nullable(),
    thumbnail: z.string().nullable()
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;
