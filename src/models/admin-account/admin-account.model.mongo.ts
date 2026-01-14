import mongoose, { Schema, Document } from 'mongoose';
import { AdminAccount } from '../../types/admin-account/admin-account';
import { RoleType } from '../../config/enums/admin-account';
export type IAdminAccountDocument = AdminAccount & Document;
// Tạo Mongoose Schema
const AdminAccountSchema = new Schema<IAdminAccountDocument>(
    {
        name: {
            type: String,
            required: [true, 'name is required'],
            trim: true,
        },
        citizenId: {
          type: String,
          required: [true, 'citizenId is required'],
          trim: true,
          unique: true,
        },
        phone: {
          type: String,
          required: [true, 'phone is required'],
          trim: true,
          unique: true,
        },
        email: {
          type: String,
          required: [true, 'email is required'],
          trim: true,
          unique: true,
        },
        hashedPassword: {
          type: String,
          required: [true, 'hashedPassword is required'],
          trim: true,
        },
        avatar: {
          type: String,
          default: null,
        },
        role: {
          type: String,
          required: [true, 'role is required'],
          enum: RoleType,
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

export const AdminAccountModel = mongoose.model<IAdminAccountDocument>(
    'AdminAccount',
    AdminAccountSchema,
    'admin-accounts'
);
