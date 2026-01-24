import mongoose, { Schema, Document } from 'mongoose';
import { Invoice } from '../../types/invoice/invoice';
import { InvoiceStatus } from '../../config/enums/invoice.enum';

export type IInvoiceDocument = Invoice & Document;

const InvoiceSchema = new Schema<IInvoiceDocument>(
    {
        orders: [
            {
                type: String,
                required: true,
            },
        ],
        owner: {
            type: String,
            required: [true, 'Owner ID is required'],
            trim: true,
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        voucher: {
            type: [String],
            default: [],
        },
        address: {
            street: { type: String, required: true },
            ward: { type: String, required: true },
            city: { type: String, required: true },
        },
        status: {
            type: String,
            enum: InvoiceStatus,
            required: true,
            default: InvoiceStatus.PENDING,
        },
        fullName: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        totalDiscount: {
            type: Number,
            default: 0,
            min: 0,
        },
        manager_onboard: {
            type: String,
            required: false,
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
InvoiceSchema.pre('save', function (next) {
    if (this.totalDiscount > this.totalPrice) {
        return next(new Error('Total discount cannot exceed total price'));
    }
    next();
});

export const InvoiceModel = mongoose.model<IInvoiceDocument>(
    'Invoice',
    InvoiceSchema
);
