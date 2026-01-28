import { z } from 'zod';
import { FrameSpecSchema } from '../frame-spec/frame-spec';
import { LenSpecSchema } from '../len-spec/len-spec';
import { VariantSchema } from '../variant/variant';
import { CheckoutSource } from '../../../config/enums/checkout.enum';
import { LensParametersSchema } from '../../lens-parameters/lens-parameters';

/**
 * Schema cho việc tạo mới Product (Frame)
 */
export const ProductCreateFrameSchema = z
    .object({
        nameBase: z.string().min(1, 'Product nameBase is required'),
        slugBase: z.string().min(1, 'Product slugBase is required').optional(),
        skuBase: z.string().min(1, 'Product skuBase is required').optional(),
        type: z.literal('frame'),
        brand: z.string().min(1, 'Brand is required').nullable(),
        categories: z
            .array(z.string())
            .min(1, 'At least one category is required'),
        spec: FrameSpecSchema,
        variants: z.array(VariantSchema),
    })
    .strict();

/**
 * Schema cho việc tạo mới Product (Sunglass)
 */
export const ProductCreateSunglassSchema = z
    .object({
        nameBase: z.string().min(1, 'Product nameBase is required'),
        slugBase: z.string().min(1, 'Product slugBase is required').optional(),
        skuBase: z.string().min(1, 'Product skuBase is required').optional(),
        type: z.literal('sunglass'),
        brand: z.string().min(1, 'Brand is required').nullable(),
        categories: z
            .array(z.string())
            .min(1, 'At least one category is required'),
        spec: FrameSpecSchema,
        variants: z.array(VariantSchema),
    })
    .strict();

/**
 * Schema cho việc tạo mới Product (Lens)
 */
export const ProductCreateLensSchema = z
    .object({
        nameBase: z.string().min(1, 'Product nameBase is required'),
        slugBase: z.string().min(1, 'Product slugBase is required').optional(),
        skuBase: z.string().min(1, 'Product skuBase is required').optional(),
        type: z.literal('lens'),
        brand: z.string().min(1, 'Brand is required').nullable(),
        categories: z
            .array(z.string())
            .min(1, 'At least one category is required'),
        spec: LenSpecSchema.nullable(),
        variants: z.array(VariantSchema),
    })
    .strict();

/**
 * Union schema cho việc tạo Product
 */
export const ProductCreateSchema = z.discriminatedUnion('type', [
    ProductCreateFrameSchema,
    ProductCreateSunglassSchema,
    ProductCreateLensSchema,
]);

/**
 * Schema cho việc cập nhật Product (Frame)
 */
export const ProductUpdateFrameSchema = z.object({
    nameBase: z.string().min(1, 'Product nameBase is required').optional(),
    slugBase: z.string().min(1, 'Product slugBase is required').optional(),
    skuBase: z.string().min(1, 'Product skuBase is required').optional(),
    type: z.literal('frame').optional(),
    brand: z.string().min(1, 'Brand is required').nullable().optional(),
    categories: z
        .array(z.string())
        .min(1, 'At least one category is required')
        .optional(),
    spec: FrameSpecSchema.optional(),
    variants: z.array(VariantSchema).optional(),
});

/**
 * Schema cho việc cập nhật Product (Sunglass)
 */
export const ProductUpdateSunglassSchema = z.object({
    nameBase: z.string().min(1, 'Product nameBase is required').optional(),
    slugBase: z.string().min(1, 'Product slugBase is required').optional(),
    skuBase: z.string().min(1, 'Product skuBase is required').optional(),
    type: z.literal('sunglass').optional(),
    brand: z.string().min(1, 'Brand is required').nullable().optional(),
    categories: z
        .array(z.string())
        .min(1, 'At least one category is required')
        .optional(),
    spec: FrameSpecSchema.optional(),
    variants: z.array(VariantSchema).optional(),
});

/**
 * Schema cho việc cập nhật Product (Lens)
 */
export const ProductUpdateLensSchema = z.object({
    nameBase: z.string().min(1, 'Product nameBase is required').optional(),
    slugBase: z.string().min(1, 'Product slugBase is required').optional(),
    skuBase: z.string().min(1, 'Product skuBase is required').optional(),
    type: z.literal('lens').optional(),
    brand: z.string().min(1, 'Brand is required').nullable().optional(),
    categories: z
        .array(z.string())
        .min(1, 'At least one category is required')
        .optional(),
    spec: LenSpecSchema.nullable().optional(),
    variants: z.array(VariantSchema).optional(),
});

/**
 * Union schema cho việc cập nhật Product
 */
export const ProductUpdateSchema = z.union([
    ProductUpdateFrameSchema,
    ProductUpdateSunglassSchema,
    ProductUpdateLensSchema,
]);

export type ProductCreateDTO = z.infer<typeof ProductCreateSchema>;
export type ProductUpdateDTO = z.infer<typeof ProductUpdateSchema>;

export const ProductConfigManufacturingSchema = z.object({
    cartProductId: z.string().optional(), // chỉ gửi nếu source = CART
    products: z.array(z.object({
        id: z.string().nonempty("Product ID is required"),
        sku: z.string().nonempty("Product SKU is required"),
    })),
    parameters: LensParametersSchema,
});

export type ProductConfigManufacturing = z.infer<typeof ProductConfigManufacturingSchema>;