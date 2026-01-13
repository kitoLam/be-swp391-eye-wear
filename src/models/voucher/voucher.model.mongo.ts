import mongoose, { Schema, Document } from 'mongoose';
import { Voucher } from '../../types/voucher/voucher';

export type IVoucherDocument = Voucher & Document;

// Main Voucher Schema
const VoucherSchema = new Schema<IVoucherDocument>(
    {
        name: {
            type: String,
            required: [true, 'Voucher name is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        code: {
            type: String,
            required: [true, 'Voucher code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        typeDiscount: {
            type: String,
            enum: {
                values: ['FIXED', 'PERCENTAGE'],
                message: 'Discount type must be FIXED or PERCENTAGE',
            },
            required: [true, 'Discount type is required'],
        },
        value: {
            type: Number,
            required: [true, 'Discount value is required'],
            min: [0, 'Value must be non-negative'],
        },
        usageLimit: {
            type: Number,
            required: [true, 'Usage limit is required'],
            min: [1, 'Usage limit must be at least 1'],
        },
        usageCount: {
            type: Number,
            required: [true, 'Usage count is required'],
            min: [0, 'Usage count must be non-negative'],
            default: 0,
        },
        startedDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endedDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        minOrderValue: {
            type: Number,
            required: [true, 'Minimum order value is required'],
            min: [0, 'Minimum order value must be non-negative'],
            default: 0,
        },
        maxDiscountValue: {
            type: Number,
            required: [true, 'Maximum discount value is required'],
            min: [0, 'Maximum discount value must be non-negative'],
        },
        applyScope: {
            type: String,
            enum: {
                values: ['ALL', 'SPECIFIC'],
                message: 'Apply scope must be ALL or SPECIFIC',
            },
            required: [true, 'Apply scope is required'],
        },
        status: {
            type: String,
            enum: {
                values: ['DRAFT', 'ACTIVE', 'DISABLE'],
                message: 'Status must be DRAFT, ACTIVE, or DISABLE',
            },
            required: [true, 'Status is required'],
            default: 'DRAFT',
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

// Index for code lookup (unique)
VoucherSchema.index({ code: 1 }, { unique: true });

// Index for status and active vouchers
VoucherSchema.index({ status: 1, deletedAt: 1 });

// Index for date range queries
VoucherSchema.index({ startedDate: 1, endedDate: 1 });

// Custom validation for percentage discount value
VoucherSchema.pre('save', function (next) {
    if (this.typeDiscount === 'PERCENTAGE' && this.value > 100) {
        return next(new Error('Percentage discount value must not exceed 100'));
    }
    next();
});

// Custom validation for date range
VoucherSchema.pre('save', function (next) {
    if (this.endedDate <= this.startedDate) {
        return next(new Error('End date must be after start date'));
    }
    next();
});

// Custom validation for usage count
VoucherSchema.pre('save', function (next) {
    if (this.usageCount > this.usageLimit) {
        return next(new Error('Usage count cannot exceed usage limit'));
    }
    next();
});

// Method to check if voucher is valid
VoucherSchema.methods.isValid = function (): boolean {
    const now = new Date();
    return (
        this.status === 'ACTIVE' &&
        this.deletedAt === null &&
        this.startedDate <= now &&
        this.endedDate >= now &&
        this.usageCount < this.usageLimit
    );
};

// Method to check if voucher can be applied to order
VoucherSchema.methods.canApplyToOrder = function (orderValue: number): boolean {
    return this.isValid() && orderValue >= this.minOrderValue;
};

// Method to calculate discount amount
VoucherSchema.methods.calculateDiscount = function (
    orderValue: number
): number {
    if (!this.canApplyToOrder(orderValue)) {
        return 0;
    }

    let discount = 0;
    if (this.typeDiscount === 'FIXED') {
        discount = this.value;
    } else if (this.typeDiscount === 'PERCENTAGE') {
        discount = (orderValue * this.value) / 100;
    }

    // Apply max discount limit
    return Math.min(discount, this.maxDiscountValue);
};

export const VoucherModel = mongoose.model<IVoucherDocument>(
    'Voucher',
    VoucherSchema
);
