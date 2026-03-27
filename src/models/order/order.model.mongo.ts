import mongoose, { Schema, Document } from 'mongoose';
import { Order } from '../../types/order/order';
import {
    OrderStatus,
    OrderType,
} from '../../config/enums/order.enum';

export type IOrderDocument = Order & Document;

// Main Order Schema
const OrderSchema = new Schema<IOrderDocument>(
    {
        orderCode: {
            type: String,
            required: true,
            unique: true,
        },
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
        },
        type: {
            type: [String],
            enum: Object.values(OrderType),
            validate: {
                validator: function (v: string[]) {
                    return v && v.length > 0;
                },
                message: 'Phải có ít nhất một loại đơn hàng (Order Type).',
            },
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
                            pricePerUnit: { type: Number, required: true },
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
                                    ADD: { type: Number, required: false },
                                },
                                right: {
                                    SPH: { type: Number, required: true },
                                    CYL: { type: Number, required: true },
                                    AXIS: { type: Number, required: true },
                                    ADD: { type: Number, required: false },
                                },
                                PD: { type: Number, required: true },
                            },
                            pricePerUnit: { type: Number, required: true },
                        },
                        { _id: false }
                    ),
                    required: false,
                },
            },
        ],
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: "AdminAccount",
            required: false,
            default: null,
        },
        verifiedAt: {
            type: Date,
            required: false,
            default: null,
        },
        assignerStaff: {
            type: String,
            trim: true,
            default: null,
        },
        assignedStaff: {
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

        price: {
            type: Number,
            required: true,
            min: 0,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        staffNote: {
            type: String,
            default: null,
        }
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
