import mongoose, { Schema, Document } from 'mongoose';
import { Order } from '../../types/order/order';
import {
    AssignmentOrderStatus,
    OrderStatus,
    OrderType,
    VerifyOrderStatus,
} from '../../config/enums/order.enum';

export type IOrderDocument = Order & Document;

// Main Order Schema
const OrderSchema = new Schema<IOrderDocument>(
    {
        owner: {
            type: String,
            required: [true, 'Owner ID is required'],
            trim: true,
        },
        orderCode: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: OrderType,
            required: [true, 'Order type is required'],
        },
        orderStatus: {
            type: String,
            enum: OrderStatus,
            default: OrderStatus.PENDING,
        },
        products: [
            {
                product: {
                    type: new Schema({
                        product_id: {
                            type: String,
                            required: true,
                        },
                        sku: String,
                        price: { type: Number, default: 0 },
                    }, {_id: false}),
                    required: false,
                    
                },
                quantity: {
                    type: Number,
                    required: [true, 'Product quantity is required'],
                    min: [1, 'Quantity must be at least 1'],
                    default: 1,
                },
                lens: {
                    /// nếu có lens sẽ validates
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
                            },
                            right: {
                                SPH: { type: Number, required: true },
                                CYL: { type: Number, required: true },
                                AXIS: { type: Number, required: true },
                            },
                            PD: { type: Number, required: true },
                        },
                    }, {_id: false}),
                    required: false, // Lens is optional
                },
            },
        ],
        shippingAddress: {
            street: { type: String, required: true },
            ward: { type: String, required: true },
            city: { type: String, required: true },
        },
        customerInfo: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
        },
        payment: {
            totalPrice: { type: Number, required: true, min: 0 },
            totalDiscount: { type: Number, default: 0, min: 0 },
            finalPrice: { type: Number, required: true, min: 0 },
            voucher: { type: [String], default: [] },
        },
        isVerified: {
            type: {
                status: {
                    type: String,
                    enum: VerifyOrderStatus,
                    default: VerifyOrderStatus.PENDING,
                },
                staffVerified: {
                    type: String,
                    trim: true,
                },
            },
            required: false,
            default: {
                status: 'PENDING',
                staffVerified: null,
            },
        },
        assignment: {
            type: {
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
                    enum: AssignmentOrderStatus,
                    default: AssignmentOrderStatus.PENDING,
                },
            },
            required: false,
            default: {
                staffId: null,
                assignStaff: null,
                assignedAt: null,
                startedAt: null,
                completedAt: null,
                status: AssignmentOrderStatus.PENDING,
            },
        },
        note: {
            type: String,
            trim: true,
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

// Custom validation to ensure totalDiscount <= totalPrice
OrderSchema.pre('save', function (next) {
    if (this.payment && this.payment.totalDiscount > this.payment.totalPrice) {
        return next(new Error('Total discount cannot exceed total price'));
    }
    next();
});

// Custom validation to ensure at least one product
OrderSchema.pre('save', function (next) {
    if (!this.products || this.products.length === 0) {
        return next(new Error('Order must have at least one product'));
    }
    next();
});

export const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);
