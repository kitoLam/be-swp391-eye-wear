import mongoose, { Schema, Document } from 'mongoose';
import { Order } from '../../types/order/order';
import {
    AssignmentOrderStatus,
    OrderStatus,
    OrderType,
} from '../../config/enums/order.enum';

export type IOrderDocument = Order & Document;

// Main Order Schema
const OrderSchema = new Schema<IOrderDocument>(
    {
        type: {
            type: String,
            enum: OrderType,
            required: [true, 'Order type is required'],
        },
        status: {
            type: String,
            enum: OrderStatus,
            default: OrderStatus.PENDING,
        },
        products: [
            {
                product: {
                    type: new Schema(
                        {
                            product_id: {
                                type: String,
                                required: true,
                            },
                            sku: String,
                            price: { type: Number, default: 0 },
                        },
                        { _id: false }
                    ),
                    required: false,
                },
                quantity: {
                    type: Number,
                    required: [true, 'Product quantity is required'],
                    min: [1, 'Quantity must be at least 1'],
                    default: 1,
                },
                lens: {
                    type: new Schema(
                        {
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
                                },
                                right: {
                                    SPH: { type: Number, required: true },
                                    CYL: { type: Number, required: true },
                                    AXIS: { type: Number, required: true },
                                },
                                PD: { type: Number, required: true },
                            },
                        },
                        { _id: false }
                    ),
                    required: false,
                },
            },
        ],

        // Verification fields (flattened)
        staffVerified: {
            type: String,
            trim: true,
            default: null,
        },

        // Assignment fields (flattened)
        staffId: {
            type: String,
            trim: true,
            default: null,
        },
        assignStaff: {
            type: String,
            trim: true,
            default: null,
        },
        assignedAt: {
            type: Date,
            default: null,
        },
        startedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        assignmentStatus: {
            type: String,
            enum: AssignmentOrderStatus,
            default: AssignmentOrderStatus.PENDING,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
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

// Custom validation to ensure at least one product
OrderSchema.pre('save', function (next) {
    if (!this.products || this.products.length === 0) {
        return next(new Error('Order must have at least one product'));
    }
    next();
});

export const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);
