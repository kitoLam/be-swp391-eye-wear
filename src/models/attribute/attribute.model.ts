import mongoose, { Schema, Document } from 'mongoose';
import { Attribute } from '../../types/attribute/attribute';
export type IAttributeDocument = Attribute & Document;
// Tạo Mongoose Schema
const AttributeSchema = new Schema<IAttributeDocument>(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
        },
        showType: {
          type: String,
          enum: ['color', 'text'],
          required: true,
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

export const AttributeModel = mongoose.model<IAttributeDocument>(
    'Attribute',
    AttributeSchema
);
