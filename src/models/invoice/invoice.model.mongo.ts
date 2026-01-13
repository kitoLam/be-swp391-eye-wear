import mongoose, { Schema, Document } from 'mongoose';
import { Invoice } from '../../types/invoice/invoice';

export type IInvoiceDocument = Invoice & Document;

// Main Invoice Schema
const InvoiceSchema = new Schema<IInvoiceDocument>(
    {
        orders: [
            {
                type: String,
                required: [true, 'Order ID is required'],
            },
        ],
        owner: {
            type: String,
            required: [true, 'Owner ID is required'],
            index: true,
        },
        totalPrice: {
            type: Number,
            required: [true, 'Total price is required'],
            min: [0, 'Total price must be non-negative'],
        },
        voucher: {
            type: [String],
            default: [],
        },
        address: {
            no: {
                type: String,
                required: [true, 'Address number is required'],
                trim: true,
            },
            ward: {
                type: String,
                required: [true, 'Ward is required'],
                trim: true,
            },
            city: {
                type: String,
                required: [true, 'City is required'],
                trim: true,
            },
        },
        status: {
            type: String,
            enum: {
                values: ['PENDING', 'DEPOSITED', 'PAIDED', 'COMPLETE'],
                message:
                    'Status must be PENDING, DEPOSITED, PAIDED, or COMPLETE',
            },
            required: [true, 'Status is required'],
            default: 'PENDING',
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        totalDiscount: {
            type: Number,
            required: [true, 'Total discount is required'],
            min: [0, 'Total discount must be non-negative'],
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

// Index for owner lookup
InvoiceSchema.index({ owner: 1 });

// Index for status queries
InvoiceSchema.index({ status: 1, deletedAt: 1 });

// Index for finding invoices by order
InvoiceSchema.index({ orders: 1 });

// Index for date range queries
InvoiceSchema.index({ createdAt: 1 });

// Custom validation to ensure at least one order
InvoiceSchema.pre('save', function (next) {
    if (!this.orders || this.orders.length === 0) {
        return next(new Error('Invoice must have at least one order'));
    }
    next();
});

// Custom validation to ensure totalDiscount <= totalPrice
InvoiceSchema.pre('save', function (next) {
    if (this.totalDiscount > this.totalPrice) {
        return next(new Error('Total discount cannot exceed total price'));
    }
    next();
});

// Method to calculate final amount
InvoiceSchema.methods.getFinalAmount = function (): number {
    return this.totalPrice - this.totalDiscount;
};

// Method to check if invoice is paid
InvoiceSchema.methods.isPaid = function (): boolean {
    return this.status === 'PAIDED' || this.status === 'COMPLETE';
};

// Method to check if invoice is completed
InvoiceSchema.methods.isCompleted = function (): boolean {
    return this.status === 'COMPLETE';
};

export const InvoiceModel = mongoose.model<IInvoiceDocument>(
    'Invoice',
    InvoiceSchema
);
