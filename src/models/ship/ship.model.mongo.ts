import mongoose, { Document, Schema } from 'mongoose';
import { Ship, ShipStatus } from '../../types/ship/ship.type';

export type IShipDocument = Ship & Document;

const ShipSchema = new Schema<IShipDocument>(
    {
        invoiceId: {
            type: String,
            required: true,
            index: true,
        },
        shipCode: {
            type: String,
            required: false,
            default: null,
            trim: true,
        },
        shipAddress: {
            type: String,
            required: true,
            trim: true,
        },
        estimatedShipDate: {
            type: Date,
            required: true,
        },
        shipCost: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        status: {
            type: String,
            enum: ShipStatus,
            required: true,
            default: 'PENDING',
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

ShipSchema.index({ invoiceId: 1, deletedAt: 1 });

export const ShipModel = mongoose.model<IShipDocument>('Ship', ShipSchema);
