import mongoose, { Schema, Document } from 'mongoose';
import { Cart } from '../../types/cart/cart';

export type ICartDocument = Cart & Document;

// Main Cart Schema
const CartSchema = new Schema<ICartDocument>(
    {
        owner: {
            type: String,
            required: [true, 'Owner ID is required'],
        },
        products: [
            {
                product_id: {
                    type: String,
                    required: [true, 'Product ID (SKU) is required'],
                    trim: true,
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
        totalProduct: {
            type: Number,
            required: [true, 'Total product is required'],
            min: [0, 'Total product must be non-negative'],
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

// Custom validation to ensure unique product_id in cart
CartSchema.pre('save', function (next) {
    if (this.products && this.products.length > 0) {
        const productIds = this.products.map(item => item.product_id);
        const uniqueProductIds = new Set(productIds);
        if (productIds.length !== uniqueProductIds.size) {
            return next(new Error('Cannot add duplicate products to cart'));
        }
    }
    next();
});

export const CartModel = mongoose.model<ICartDocument>('Cart', CartSchema);
