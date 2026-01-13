import z from 'zod';
import { FrameSpecSchema } from '../frame-spec/frame-spec';
import { LenSpecSchema } from '../len-spec/len-spec';
import { VariantSchema } from '../variant/variant';

export const ProductSchema = z.discriminatedUnion('type', [
    //Neu la frame thi object se la dang nay
    z.object({
        _id: z.string().min(1, 'Product ID is required'),
        nameBase: z.string().min(1, 'Product nameBase is required'),
        slugBase: z.string().min(1, 'Product slugBase is required'),
        skuBase: z.string().min(1, 'Product skuBase is required'),
        type: z.literal('frame'),
        brand: z.string().min(1, 'Brand is required').nullable(),
        categories: z
            .array(z.string())
            .min(1, 'At least one category is required'),
        spec: FrameSpecSchema,
        variants: z.array(VariantSchema),
        updatedAt: z.date().optional(),
        createdAt: z.date().optional(),
        deletedAt: z.date().nullable().optional(),
    }),
    //Neu la len thi object se la dang nay
    z.object({
        _id: z.string().min(1, 'Product ID is required'),
        nameBase: z.string().min(1, 'Product nameBase is required'),
        slugBase: z.string().min(1, 'Product slugBase is required'),
        skuBase: z.string().min(1, 'Product skuBase is required'),
        type: z.literal('lens'),
        brand: z.string().min(1, 'Brand is required').nullable(),
        categories: z
            .array(z.string())
            .min(1, 'At least one category is required'),
        spec: LenSpecSchema.nullable(),
        variants: z.array(VariantSchema),
        updatedAt: z.date().optional(),
        createdAt: z.date().optional(),
        deletedAt: z.date().nullable().optional(),
    }),
]);

export type Product = z.infer<typeof ProductSchema>;
