import mongoose, { Schema, Document } from 'mongoose';
import { FullUser } from '../../types/user/user';

export type IUserDocument = FullUser & Document;

// Tạo Mongoose Schema
const UserSchema = new Schema<IUserDocument>(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        deletedAt: { type: Date, default: null },
    },
    {
        timestamps: true, // Tự động tạo createdAt và updatedAt
    }
);
export const User = mongoose.model<IUserDocument>('User', UserSchema);
