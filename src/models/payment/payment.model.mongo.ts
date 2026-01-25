import mongoose, { Schema, Document } from 'mongoose';
import { Payment } from '../../types/payment/payment';
import { PaymentMethodType, PaymentStatus } from '../../config/enums/payment.enum';

export type IPaymentDocument = Payment & Document;

// Main Payment Schema
const PaymentSchema = new Schema<IPaymentDocument>(
    {
        ownerId: {
            type: String,
            required: [true, 'Owner ID is required'],
        },
        invoiceId: {
            type: String,
            required: [true, 'Order ID is required'],
        },
        paymentMethod: {
            type: String,
            enum: PaymentMethodType,
            required: [true, 'Payment method is required'],
        },
        status: {
            type: String,
            enum: PaymentStatus,
            default: 'UNPAID',
        },
        note: {
            type: String,
            trim: true,
            default: '',
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
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

// Index for status queries
// PaymentSchema.index({ status: 1, deletedAt: 1 });

// Compound index for owner and status
// PaymentSchema.index({ owner_id: 1, status: 1 });

// Compound index for order and status
// PaymentSchema.index({ payForOrder: 1, status: 1 });

// Method to check if payment is completed
PaymentSchema.methods.isPaid = function (): boolean {
    return this.status === 'PAID';
};

// Method to mark as paid
PaymentSchema.methods.markAsPaid = async function (): Promise<void> {
    this.status = 'PAID';
    await this.save();
};

// Method to mark as unpaid
PaymentSchema.methods.markAsUnpaid = async function (): Promise<void> {
    this.status = 'UNPAID';
    await this.save();
};

// Method to check if it's a refund
PaymentSchema.methods.isRefund = function (): boolean {
    return this.price < 0;
};

export const PaymentModel = mongoose.model<IPaymentDocument>(
    'Payment',
    PaymentSchema
);
