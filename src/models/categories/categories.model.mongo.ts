import mongoose, { Schema, Document } from 'mongoose';
import { Category } from '../../types/categories/categories';

export type ICategoryDocument = Category & Document;

// Tạo Mongoose Schema
const CategorySchema = new Schema<ICategoryDocument>(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['frame', 'lens'],
            required: [true, 'Category type is required'],
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
    },
    {
        timestamps: true,
    }
);

export const CategoryModel = mongoose.model<ICategoryDocument>(
    'Category',
    CategorySchema
);
