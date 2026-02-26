import mongoose, { Schema, Document } from 'mongoose';
import { Invoice } from '../../types/invoice/invoice';
import { InvoiceStatus } from '../../config/enums/invoice.enum';

export type IInvoiceDocument = Invoice & Document;

const InvoiceSchema = new Schema<IInvoiceDocument>(
    {
        invoiceCode: {
            type: String,
            required: true,
            unique: true,
        },
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
        managerOnboard: {
            type: String,
            default: null
        },
        onboardedAt: {
            type: Date,
            default: null
        },
        staffHandleDelivery: {
            type: String,
            default: null
        },
        assignStaffHandleDeliveryAt: {
            type: Date,
            default: null
        },
        note: {
            type: String,
            trim: true,
            default: '',
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        staffVerified: {
            type: String,
            trim: true,
            default: null,
        },
        verifiedAt: {
            type: Date,
            required: false,
            default: null,
        },
        rejectedNote: {
            type: String,
            required: false,
        },
        feeShip: {
            type: Number,
            required: false,
            default: 10000,
        }
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
