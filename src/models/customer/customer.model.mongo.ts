import mongoose, { Schema, Document } from 'mongoose';
import { Customer } from '../../types/customer/customer';

export type ICustomerDocument = Customer & Document;
const AddressSchema = new Schema(
    {
        street: {
            type: String,
            required: true,
            trim: true,
        },
        ward: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        }
    },
    { _id: true } // để mỗi address có id riêng
);
const ParametersSchema = new Schema({
    left: {
        SPH: { type: Number, required: true },
        CYL: { type: Number, required: true },
        AXIS: { type: Number, required: true },
        ADD: { type: Number, required: true },
    },
    right: {
        SPH: { type: Number, required: true },
        CYL: { type: Number, required: true },
        AXIS: { type: Number, required: true },
        ADD: { type: Number, required: true },
    },
    PD: { type: Number, required: true },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {_id: true});
// Main Customer Schema
const CustomerSchema = new Schema<ICustomerDocument>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
                message: 'Invalid email format',
            },
        },
        hashedPassword: {
            type: String,
            required: false,
        },
        phone: {
            type: String,
            required: false,
            unique: true,
            trim: true,
        },
        gender: {
            type: String,
            enum: {
                values: ['F', 'M', 'N'],
                message:
                    'Gender must be F (Female), M (Male), or N (Not specified)',
            },
            default: 'N',
        },
        address: {
            type: [AddressSchema],
            default: [],
        },
        parameters: {
            type: [ParametersSchema],
            default: [],
        },
        hobbies: {
            type: [String],
            default: [],
        },
        isVerified: {
            type: Boolean,
            default: true,
        },
        providers: {
            type: [String],
            enum: ["google", "local"],
            required: true,
        },
        googleId: {
            type: String,
            unique: true,
            required: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'AdminAccount',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export const CustomerModel = mongoose.model<ICustomerDocument>(
    'Customer',
    CustomerSchema
);
