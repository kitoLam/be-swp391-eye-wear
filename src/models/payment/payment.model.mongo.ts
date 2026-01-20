import mongoose, { Schema, Document } from 'mongoose';
import { Payment } from '../../types/payment/payment';

export type IPaymentDocument = Payment & Document;

// Main Payment Schema
const PaymentSchema = new Schema<IPaymentDocument>(
    {
        owner_id: {
            type: String,
            required: [true, 'Owner ID is required'],
        },
        invoice_id: {
            type: String,
            required: [true, 'Invoice ID is required'],
        },
        payForOrder: {
            type: String,
            required: [true, 'Order ID is required'],
        },
        payment_method: {
            type: String,
            enum: {
                values: ['CASH', 'BANK'],
                message: 'Payment method must be CASH or BANK',
            },
            required: [true, 'Payment method is required'],
        },
        status: {
            type: String,
            enum: {
                values: ['PAID', 'UNPAID'],
                message: 'Status must be PAID or UNPAID',
            },
            required: [true, 'Payment status is required'],
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
            // Removed min validation to allow negative values for refunds
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
