import mongoose, { Schema, Document, Types } from 'mongoose';
import { NotificationType } from '../../config/enums/notification.enum';

export interface INotification extends Document {
    customerId: Types.ObjectId;
    title: string;
    type: NotificationType;
    message: string;
    allowedStaffs: string[];
    readBy: string[];
    createdAt: Date;
    updatedAt: Date;
    metadata: {
        orderId?: string;
        invoiceId?: string;
    };
}

const schema = new Schema<INotification>(
    {
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: NotificationType,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        allowedStaffs: {
            type: [String],
            default: [],
        },
        readBy: {
            type: [String],
            default: [],
        },
        createdAt: Date,
        metadata: {
            type: new Schema(
                {
                    orderId: String,
                    invoiceId: String,
                },
                { _id: false }
            ),
            default: null,
        },
    },
    { timestamps: true }
);

export const NotificationModel = mongoose.model(
    'Notification',
    schema,
    'notifications'
);
