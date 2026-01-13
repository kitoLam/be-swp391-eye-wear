import mongoose, { Schema, Document } from 'mongoose';
import { Order } from '../../types/order/order';

export type IOrderDocument = Order & Document;

// Main Order Schema
const OrderSchema = new Schema<IOrderDocument>(
    {
        type: {
            type: String,
            enum: {
                values: ['NORMAL', 'PRE-ORDER', 'CUSTOM'],
                message: 'Order type must be NORMAL or PRE-ORDER',
            },
            required: [true, 'Order type is required'],
        },
        products: [
            {
                frames: {
                    type: String,
                    required: [true, 'Frame ID is required'],
                    trim: true,
                },
                lens: {
                    lens_id: {
                        type: String,
                        required: [true, 'Lens ID is required'],
                        trim: true,
                    },
                    parameters: {
                        left: {
                            SPH: {
                                type: Number,
                                required: [true, 'Left SPH is required'],
                            },
                            CYL: {
                                type: Number,
                                required: [true, 'Left CYL is required'],
                            },
                            AXIS: {
                                type: Number,
                                required: [true, 'Left AXIS is required'],
                            },
                        },
                        right: {
                            SPH: {
                                type: Number,
                                required: [true, 'Right SPH is required'],
                            },
                            CYL: {
                                type: Number,
                                required: [true, 'Right CYL is required'],
                            },
                            AXIS: {
                                type: Number,
                                required: [true, 'Right AXIS is required'],
                            },
                        },
                        PD: {
                            type: Number,
                            required: [true, 'PD is required'],
                        },
                    },
                    quantity: {
                        type: Number,
                        required: [true, 'Lens quantity is required'],
                        min: [1, 'Quantity must be at least 1'],
                    },
                },
            },
        ],
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price must be non-negative'],
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

// Index for order type
OrderSchema.index({ type: 1 });

// Index for finding active orders (not deleted)
OrderSchema.index({ type: 1, deletedAt: 1 });

// Index for price range queries
OrderSchema.index({ price: 1 });

// Custom validation to ensure at least one product
OrderSchema.pre('save', function (next) {
    if (!this.products || this.products.length === 0) {
        return next(new Error('Order must have at least one product'));
    }
    next();
});

export const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);
