import z from 'zod';

export const VariantSchema = z
    .object({
        sku: z.string().min(1, 'SKU is required').optional(),
        name: z.string().min(1, 'Name is required').optional(),
        slug: z.string().min(1, 'Slug is required').optional(),
        options: z.array(
            z.object({
                attributeId: z.string().min(1, 'Attribute ID is required'),
                attributeName: z.string().min(1, 'Attribute Name is required'),
                label: z.string().min(1, 'Option Label is required'),
                showType: z.enum(
                    ['color', 'text'],
                    'Show Type must be either "color" or "text"'
                ),
                value: z.string().min(1, 'Option Value is required'),
            })
        ),
        price: z.number().nonnegative('Price must be a non-negative number'),
        finalPrice: z
            .number()
            .nonnegative('Final Price must be a non-negative number'),
        stock: z
            .number()
            .int()
            .nonnegative('Stock must be a non-negative integer'),
        imgs: z.array(z.string()),
        isDefault: z.boolean().default(false),
        updatedAt: z.date().optional(),
        createdAt: z.date().optional(),
        deletedAt: z.date().nullable().optional(),
    })
    .refine(data => data.finalPrice <= data.price, {
        message: 'Final Price cannot be greater than the default Price',
        path: ['finalPrice'],
    });

export type Variant = z.infer<typeof VariantSchema>;
