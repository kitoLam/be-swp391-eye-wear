import mongoose, { Document, Schema } from 'mongoose';

export interface ShipFee {
    province: string;
    district: string | null;
    ward: string | null;
    fee: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export type IShipFeeDocument = ShipFee & Document;

const ShipFeeSchema = new Schema<IShipFeeDocument>(
    {
        province: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        district: {
            type: String,
            default: null,
            trim: true,
            uppercase: true,
        },
        ward: {
            type: String,
            default: null,
            trim: true,
            uppercase: true,
        },
        fee: {
            type: Number,
            required: true,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: 'shipfees',
    }
);

ShipFeeSchema.index({ province: 1, district: 1, ward: 1 }, { unique: true });

export const ShipFeeModel = mongoose.model<IShipFeeDocument>(
    'ShipFee',
    ShipFeeSchema
);
