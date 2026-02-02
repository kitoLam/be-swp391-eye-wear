import mongoose, { Schema, Document } from 'mongoose';
import { Cart } from '../../types/cart/cart';
import {
    BadRequestError,
    ConflictRequestError,
} from '../../errors/apiError/api-error';

export type ICartDocument = Cart & Document;

// Main Cart Schema
const CartSchema = new Schema<ICartDocument>(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Owner ID is required'],
        },
        products: {
            type: [
                {
                    product: {
                        type: new Schema(
                            {
                                product_id: {
                                    type: String,
                                    required: true,
                                },
                                sku: String,
                            },
                            { _id: false }
                        ),
                        required: [true, 'Product ID (SKU) is required'],
                        default: null,
                    },
                    lens: {
                        type: new Schema({
                            lens_id: {
                                type: String,
                                required: [true, 'Lens ID is required'],
                                trim: true,
                            },
                            sku: {
                                type: String,
                                required: [true, 'SKU is required'],
                                trim: true,
                            },
                            parameters: {
                                left: {
                                    SPH: { type: Number, required: true },
                                    CYL: { type: Number, required: true },
                                    AXIS: { type: Number, required: true },
                                    ADD: { type: Number, required: true },
                                },
                                right: {
                                    SPH: { type: Number, required: true },
                                    CYL: { type: Number, required: true },
                                    AXIS: { type: Number, required: true },
                                    ADD: { type: Number, required: true },
                                },
                                PD: { type: Number, required: true },
                            },
                        }),
                    },
                    quantity: {
                        type: Number,
                        required: [true, 'Quantity is required'],
                        min: [1, 'Quantity must be at least 1'],
                    },
                    addAt: {
                        type: Date,
                        required: [true, 'Add date is required'],
                        default: Date.now,
                    },
                },
            ],
            default: [],
        },
        totalProduct: {
            type: Number,
            default: 0,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for finding active carts (not deleted)
// CartSchema.index({ owner: 1, deletedAt: 1 });

// Pre-save hook to calculate totalProduct
CartSchema.pre('save', function (next) {
    if (this.products && this.products.length > 0) {
        this.totalProduct = this.products.reduce(
            (total, item) => total + item.quantity,
            0
        );
    } else {
        this.totalProduct = 0;
    }
    next();
});

// Custom validation to ensure unique item in cart
CartSchema.pre('save', function (next) {
    if (this.products && this.products.length > 0) {
        const productIds = this.products.map(
            item =>
                (item.product
                    ? item.product.product_id + item.product.sku
                    : '') + (item.lens ? item.lens.lens_id + item.lens.sku : '')
        );
        const uniqueProductIds = new Set(productIds);
        if (productIds.length !== uniqueProductIds.size) {
            return next(
                new BadRequestError('Cannot add duplicate product item to cart')
            );
        }
    }
    next();
});

export const CartModel = mongoose.model<ICartDocument>('Cart', CartSchema);
