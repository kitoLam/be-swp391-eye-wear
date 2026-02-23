import z from 'zod';

// Voucher Schema
export const VoucherSchema = z
    .object({
        _id: z.string().min(1, 'Voucher ID is required'),
        name: z.string().min(1, 'Voucher name is required'),
        description: z.string().min(1, 'Description is required'),
        code: z.string().min(1, 'Voucher code is required').toUpperCase(),
        typeDiscount: z.enum(['FIXED', 'PERCENTAGE']),
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
        applyScope: z.enum(['ALL', 'SPECIFIC']),
        status: z.enum(['DRAFT', 'ACTIVE', 'DISABLE']),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
        deletedAt: z.date().nullable().optional(),
    })
    .refine(
        data => {
            // If typeDiscount is PERCENTAGE, value must be <= 100
            if (data.typeDiscount === 'PERCENTAGE') {
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
        name: z.string().min(1, 'Voucher name is required'),
        description: z.string().min(1, 'Description is required'),
        code: z.string().min(1, 'Voucher code is required').toUpperCase(),
        typeDiscount: z.enum(['FIXED', 'PERCENTAGE']),
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
        applyScope: z.enum(['ALL', 'SPECIFIC']),
        status: z.enum(['DRAFT', 'ACTIVE', 'DISABLE']).default('DRAFT'),
    })
    .refine(
        data => {
            if (data.typeDiscount === 'PERCENTAGE') {
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
    );

// Update Voucher Schema
export const UpdateVoucherSchema = z.object({
    name: z.string().min(1, 'Voucher name is required').optional(),
    description: z.string().min(1, 'Description is required').optional(),
    typeDiscount: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    value: z.number().min(0, 'Value must be non-negative').optional(),
    usageLimit: z
        .number()
        .int()
        .min(1, 'Usage limit must be at least 1')
        .optional(),
    startedDate: z.date().optional(),
    endedDate: z.date().optional(),
    minOrderValue: z
        .number()
        .min(0, 'Minimum order value must be non-negative')
        .optional(),
    maxDiscountValue: z
        .number()
        .min(0, 'Maximum discount value must be non-negative')
        .optional(),
    applyScope: z.enum(['ALL', 'SPECIFIC']).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'DISABLE']).optional(),
});

export type Voucher = z.infer<typeof VoucherSchema>;
export type CreateVoucher = z.infer<typeof CreateVoucherSchema>;
export type UpdateVoucher = z.infer<typeof UpdateVoucherSchema>;
