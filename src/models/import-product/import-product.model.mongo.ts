import mongoose, { Schema } from 'mongoose';
import { ImportProduct } from '../../types/import-product/import-product';

export interface IImportProductDocument
    extends mongoose.Document, ImportProduct {}

const ImportProductSchema = new Schema<IImportProductDocument>(
    {
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            trim: true,
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
        },
        staffResponsible: {
            type: String,
            required: [true, 'Staff responsible is required'],
            trim: true,
        },
        preOrderImportId: {
            type: String,
            required: [true, 'Pre-order import ID is required'],
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

export const ImportProductModel = mongoose.model<IImportProductDocument>(
    'ImportProduct',
    ImportProductSchema
);
