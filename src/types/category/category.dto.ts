import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Zod schema for creating a new category
 */
export const CreateCategorySchema = z
    .object({
        name: z
            .string()
            .min(1, 'Category name is required')
            .max(100, { error: 'name can only under 100 char' })
            .regex(/^[a-zA-Z\s]+$/, 'Name must only contain letters'),
        parentId: z
            .string()
            .refine(
                value => Types.ObjectId.isValid(value),
                'parentId is not valid'
            )
            .or(z.literal(null))
            .transform(value => (value == 'null' ? null : value))
            .nullable(),
        thumbnail: z.string().url().or(z.literal('')),
    })
    .strict();

/**
 * Zod schema for updating a category
 */
export const UpdateCategorySchema = z
    .object({
        name: z
            .string()
            .min(1, 'Category name is required')
            .max(100, { error: 'name can only under 100 char' })
            .regex(/^[a-zA-Z\s]+$/, 'Name must only contain letters'),
        parentId: z
            .string()
            .refine(
                value => Types.ObjectId.isValid(value),
                'parentId is not valid'
            )
            .or(z.literal(null))
            .transform(value => (value == 'null' ? null : value))
            .nullable(),
        thumbnail: z.string().url().or(z.literal('')),
    })
    .strict();

export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;
