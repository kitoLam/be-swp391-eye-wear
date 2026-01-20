import mongoose, { Schema, Document } from 'mongoose';
import { Order } from '../../types/order/order';

export type IOrderDocument = Order & Document;

// Main Order Schema
const OrderSchema = new Schema<IOrderDocument>(
    {
        type: {
            type: String,
            enum: {
                values: ['NORMAL', 'PRE-ORDER', 'MANUFACTURING'],
                message:
                    'Order type must be NORMAL, PRE-ORDER, or MANUFACTURING',
            },
            required: [true, 'Order type is required'],
        },
        products: [
            {
                // Updated: renamed 'frames' to 'product_id' and added quantity
                product_id: {
                    type: String,
                    required: [true, 'Product ID is required'],
                    trim: true,
                },
                quantity: {
                    type: Number,
                    required: [true, 'Product quantity is required'],
                    min: [1, 'Quantity must be at least 1'],
                    default: 1,
                },
                lens: {
                    // Lens object is now optional, so type fields are not strictly required unless lens is present.
                    // However, in Mongoose, if 'lens' is present, we enforce validation via schema structure or logic.
                    // Defining it as a sub-schema with required=false allows it to be optional.
                    type: new Schema(
                        {
                            lens_id: {
                                type: String,
                                required: [true, 'Lens ID is required'],
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
                            quantity: {
                                type: Number,
                                required: [true, 'Lens quantity is required'],
                                min: [1, 'Quantity must be at least 1'],
                                default: 1,
                            },
                        },
                        { _id: false }
                    ), // No separate _id for lens sub-doc if desired, or keep it. Often sub-docs get _ids.
                    required: false, // Lens is optional
                },
                // Backward compatibility mapping can be handled in code if needed, but for now we follow new structure.
            },
        ],
        isVerified: {
            status: {
                type: String,
                enum: {
                    values: ['PENDING', 'APPROVE', 'REJECT'],
                    message:
                        'Verification status must be PENDING, APPROVE, or REJECT',
                },
                default: 'PENDING',
            },
            staffVerified: {
                type: String,
                trim: true,
            },
        },
        assignment: {
            staffId: {
                type: String,
                trim: true,
            },
            assignStaff: {
                type: String,
                trim: true,
            },
            assignedAt: {
                type: Date,
            },
            startedAt: {
                type: Date,
            },
            completedAt: {
                type: Date,
            },
            status: {
                type: String,
                enum: {
                    values: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'],
                    message:
                        'Assignment status must be PENDING, ASSIGNED, IN_PROGRESS, or COMPLETED',
                },
                default: 'PENDING',
            },
        },
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

// Custom validation to ensure at least one product
OrderSchema.pre('save', function (next) {
    if (!this.products || this.products.length === 0) {
        return next(new Error('Order must have at least one product'));
    }
    next();
});

export const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);
