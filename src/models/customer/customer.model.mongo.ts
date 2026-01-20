import mongoose, { Schema, Document } from 'mongoose';
import { Customer } from '../../types/customer/customer';

export type ICustomerDocument = Customer & Document;

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
            required: [true, 'Password is required'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
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
        },
        address: [
            {
                street: {
                    type: String,
                    required: [true, 'Address street is required'],
                    trim: true,
                },
                ward: {
                    type: String,
                    required: [true, 'Ward is required'],
                    trim: true,
                },
                city: {
                    type: String,
                    required: [true, 'City is required'],
                    trim: true,
                },
            },
        ],
        hobbies: {
            type: [String],
            default: [],
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        linkedAccounts: [
            {
                provider: {
                    type: String,
                    required: [true, 'Provider is required'],
                    trim: true,
                },
                sub: {
                    type: String,
                    required: [true, 'Subject is required'],
                    trim: true,
                },
                email_verified: {
                    type: Boolean,
                    default: false,
                },
                given_name: {
                    type: String,
                    trim: true,
                },
                family_name: {
                    type: String,
                    trim: true,
                },
                picture: {
                    type: String,
                    trim: true,
                },
                locale: {
                    type: String,
                    trim: true,
                },
                linkedAt: {
                    type: Date,
                    required: [true, 'Linked date is required'],
                    default: Date.now,
                },
            },
        ],
        deletedAt: {
            type: Date,
            default: null,
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'AdminAccount',
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

// Custom validation to ensure unique provider per customer
CustomerSchema.pre('save', function (next) {
    if (this.linkedAccounts && this.linkedAccounts.length > 0) {
        const providers = this.linkedAccounts.map(acc => acc.provider);
        const uniqueProviders = new Set(providers);
        if (providers.length !== uniqueProviders.size) {
            return next(
                new Error(
                    'Cannot link multiple accounts from the same provider'
                )
            );
        }
    }
    next();
});

export const CustomerModel = mongoose.model<ICustomerDocument>(
    'Customer',
    CustomerSchema
);
