import mongoose, { Document, Schema } from 'mongoose';
import { ReturnTicket } from '../../types/return-ticket/return-ticket.type';
import { ReturnTicketStatus } from '../../config/enums/return-ticket.enum';

export type IReturnTicketDocument = ReturnTicket & Document;

const returnTicketSchema = new Schema<IReturnTicketDocument>(
    {
        orderId: {
            type: String,
            required: true,
            index: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
            index: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        media: {
            type: [String],
            default: [],
        },
        staffVerify: {
            type: Schema.Types.ObjectId,
            ref: 'AdminAccount',
            required: false,
            default: null,
        },
        skus: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: Object.values(ReturnTicketStatus),
            default: ReturnTicketStatus.PENDING,
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

// Index for soft delete filtering
returnTicketSchema.index({ deletedAt: 1 });

export const ReturnTicketModel = mongoose.model<IReturnTicketDocument>(
    'ReturnTicket',
    returnTicketSchema
);
