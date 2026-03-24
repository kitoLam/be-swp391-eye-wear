import z from 'zod';
import {
    VoucherType,
    VoucherStatus,
    VoucherApplyScope,
} from '../../config/enums/voucher.enum';

// Voucher Schema
export const VoucherSchema = z
    .object({
        _id: z.string().min(1, 'Voucher ID is required'),
        name: z.string().min(1, 'Voucher name is required'),
        description: z.string().min(1, 'Description is required'),
        code: z.string().min(1, 'Voucher code is required').toUpperCase(),
        typeDiscount: z.nativeEnum(VoucherType),
        value: z.number().min(0, 'Value must be non-negative'),
        usageLimit: z.number().int().min(1, 'Usage limit must be at least 1'),
        usageCount: z
            .number()
            .int()
            .min(0, 'Usage count must be non-negative')
            .default(0),
        startedDate: z.coerce.date(),
        endedDate: z.coerce.date(),
        minOrderValue: z
            .number()
            .min(0, 'Minimum order value must be non-negative'),
        maxDiscountValue: z
            .number()
            .min(0, 'Maximum discount value must be non-negative'),
        applyScope: z.nativeEnum(VoucherApplyScope),
        status: z.nativeEnum(VoucherStatus),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
        deletedAt: z.date().nullable().optional(),
    })
    .refine(
        data => {
            // If typeDiscount is PERCENTAGE, value must be <= 100
            if (data.typeDiscount === VoucherType.PERCENTAGE) {
                return data.value <= 100;
            }
            return true;
        },
        {
            message: 'Percentage discount value must not exceed 100',
            path: ['value'],
        }
    )
    .refine(
        data => {
            // endedDate must be after startedDate
            return data.endedDate > data.startedDate;
        },
        {
            message: 'End date must be after start date',
            path: ['endedDate'],
        }
    );

// Create Voucher Schema
export const CreateVoucherSchema = z
    .object({
        name: z.string().min(1, 'Voucher name is required').max(255),
        description: z.string().min(1, 'Description is required').max(500),
        code: z.string().min(1, 'Voucher code is required').max(50, 'Code must not exceed 50 characters').toUpperCase(),
        typeDiscount: z.nativeEnum(VoucherType),
        value: z.number().min(0, 'Value must be non-negative'),
        usageLimit: z.number().int().min(1, 'Usage limit must be at least 1'),
        startedDate: z.coerce.date(),
        endedDate: z.coerce.date(),
        minOrderValue: z
            .number()
            .min(0, 'Minimum order value must be non-negative')
            .default(0),
        maxDiscountValue: z
            .number()
            .min(0, 'Maximum discount value must be non-negative'),
        applyScope: z.enum(VoucherApplyScope),
        status: z.enum(VoucherStatus).default(VoucherStatus.DRAFT),
    })
    .refine(
        data => {
            if (data.typeDiscount === VoucherType.PERCENTAGE) {
                return data.value <= 100;
            }
            return true;
        },
        {
            message: 'Percentage discount value must not exceed 100',
            path: ['value'],
        }
    )
    .refine(
        data => {
            return data.endedDate > data.startedDate;
        },
        {
            message: 'End date must be after start date',
            path: ['endedDate'],
        }
    ).strict();

// Update Voucher Schema
export const UpdateVoucherSchema = z
    .object({
        name: z.string().min(1, 'Voucher name is required').max(255).optional(),
        code: z.string().min(1, 'Voucher code is required').max(50, 'Code must not exceed 50 characters').toUpperCase(),
        description: z.string().min(1, 'Description is required').optional(),
        typeDiscount: z.nativeEnum(VoucherType).optional(),
        value: z.number().min(0, 'Value must be non-negative').optional(),
        usageLimit: z
            .number()
            .int()
            .min(1, 'Usage limit must be at least 1')
            .optional(),
        startedDate: z.coerce.date(),
        endedDate: z.coerce.date(),
        minOrderValue: z
            .number()
            .min(0, 'Minimum order value must be non-negative')
            .optional(),
        maxDiscountValue: z
            .number()
            .min(0, 'Maximum discount value must be non-negative')
            .optional(),
        applyScope: z.enum(VoucherApplyScope).optional(),
        status: z.enum(VoucherStatus).optional(),
    })
    .refine(
        data => {
            if (data.typeDiscount === VoucherType.PERCENTAGE) {
                return data.value && data.value <= 100;
            }
            return true;
        },
        {
            message: 'Percentage discount value must not exceed 100',
            path: ['value'],
        }
    ).refine(
        data => {
            return data.endedDate > data.startedDate;
        },
        {
            message: 'End date must be after start date',
            path: ['endedDate'],
        }
    ).strict();

export type Voucher = z.infer<typeof VoucherSchema>;
export type CreateVoucher = z.infer<typeof CreateVoucherSchema>;
export type UpdateVoucher = z.infer<typeof UpdateVoucherSchema>;
