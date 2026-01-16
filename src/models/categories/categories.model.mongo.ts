import mongoose, { Schema, Document } from 'mongoose';
import { Category } from '../../types/category/category';

export type ICategoryDocument = Category & Document;

// Tạo Mongoose Schema
const CategorySchema = new Schema<ICategoryDocument>(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
        },
        parentCate: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'AdminAccount',
            required: true,
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'AdminAccount',
            default: null,
        },
        thumbnail: {
            type: String,
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

export const CategoryModel = mongoose.model<ICategoryDocument>(
    'Category',
    CategorySchema
);
