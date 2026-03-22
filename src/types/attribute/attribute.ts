import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Zod schema for Categories validation
 */
export const AttributeSchema = z.object({
    _id: z.instanceof(Types.ObjectId),
    name: z.string().min(1, 'Attribute name is required'),
    showType: z.enum(['color', 'text']),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    createdBy: z.instanceof(Types.ObjectId),
    deletedBy: z.instanceof(Types.ObjectId).nullable()
});

export const AttributeCreateSchema = z.object({
    name: z.string().min(1, 'Attribute name is required').max(100, 'Attribute name is max 100 character'),
    showType: z.enum(['color', 'text'], { error: "Show type only allow to be color or text"})
}).strict();

export const AttributeUpdateSchema = z.object({
    name: z.string().min(1, 'Attribute name is required').max(100, 'Attribute name is max 100 character'),
    showType: z.enum(['color', 'text'], { error: "Show type only allow to be color or text"})
}).strict();

export type Attribute = z.infer<typeof AttributeSchema>;
export type AttributeCreateDTO = z.infer<typeof AttributeCreateSchema>;
export type AttributeUpdateDTO = z.infer<typeof AttributeUpdateSchema>;
