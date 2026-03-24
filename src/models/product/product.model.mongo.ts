import mongoose, { Schema, Document } from 'mongoose';
import { Product } from '../../types/product/product/product';
import { ProductVariantMode } from '../../config/enums/product.enum';

export type IProductDocument = Product & Document;

// Main Product Schema
const ProductSchema = new Schema<IProductDocument>(
    {
        nameBase: {
            type: String,
            required: [true, 'Product nameBase is required'],
            trim: true,
        },
        slugBase: {
            type: String,
            required: [true, 'Product slugBase is required'],
            trim: true,
        },
        skuBase: {
            type: String,
            required: [true, 'Product skuBase is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['frame', 'lens', 'sunglass'],
            required: [true, 'Product type is required'],
        },
        brand: {
            type: String,
            default: null,
        },
        categories: {
            type: [String],
            required: [true, 'At least one category is required'],
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: 'At least one category is required',
            },
        },
        spec: {
            type: Schema.Types.Mixed,
            default: null,
        },
        variants: [
            {
                sku: {
                    type: String,
                    required: [true, 'SKU is required'],
                },
                name: {
                    type: String,
                    required: [true, 'Name is required'],
                },
                slug: {
                    type: String,
                    required: [true, 'Slug is required'],
                },
                options: [
                    {
                        attributeId: {
                            type: String,
                            required: [true, 'Attribute ID is required'],
                        },
                        attributeName: {
                            type: String,
                            required: [true, 'Attribute Name is required'],
                        },
                        label: {
                            type: String,
                            required: [true, 'Option Label is required'],
                        },
                        showType: {
                            type: String,
                            enum: ['color', 'text'],
                            required: [true, 'Show Type is required'],
                        },
                        value: {
                            type: String,
                            required: [true, 'Option Value is required'],
                        },
                    },
                ],
                price: {
                    type: Number,
                    required: [true, 'Price is required'],
                    min: [0, 'Price must be non-negative'],
                },
                finalPrice: {
                    type: Number,
                    required: [true, 'Final Price is required'],
                    min: [0, 'Final Price must be non-negative'],
                },
                stock: {
                    type: Number,
                    required: [true, 'Stock is required'],
                    min: [0, 'Stock must be non-negative'],
                },
                imgs: {
                    type: [String],
                    default: [],
                },
                isDefault: {
                    type: Boolean,
                    default: false,
                },
                createdAt: {
                    type: Date,
                },
                updatedAt: {
                    type: Date,
                },
                deletedAt: {
                    type: Date,
                    default: null,
                },
                mode: {
                    type: String,
                    enum: ProductVariantMode,
                    default: 'AVAILABLE',
                },
                virTryOnUrl: {
                    type: String,
                    required: false,
                    default: null,
                }
            },
        ],
        deletedAt: {
            type: Date,
            default: null,
        },
        embedding: {
            type: [Number],
            default: null,
        },
        embeddingModel: {
            type: String,
            default: null,
        },
        embeddingUpdatedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Custom validation for spec based on type
ProductSchema.pre('save', function (next) {
    if (this.spec !== null) {
        if (this.type === 'frame' || this.type === 'sunglass') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const frameSpec = this.spec as any;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!frameSpec.material || !frameSpec.shape || !frameSpec.gender) {
                return next(
                    new Error(
                        'Frame/Sunglass spec must include material, shape, and gender'
                    )
                );
            }
        } else if (this.type === 'lens') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const lenSpec = this.spec as any;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!lenSpec.feature) {
                return next(new Error('Lens spec must include feature'));
            }
        }
    }
    next();
});

// Custom validation for finalPrice <= price in variants
ProductSchema.pre('save', function (next) {
    if (this.variants && this.variants.length > 0) {
        for (const variant of this.variants) {
            if (variant.finalPrice > variant.price) {
                return next(
                    new Error(
                        `Variant ${variant.sku}: Final Price cannot be greater than Price`
                    )
                );
            }
        }
    }
    next();
});

export const ProductModel = mongoose.model<IProductDocument>(
    'Product',
    ProductSchema
);
