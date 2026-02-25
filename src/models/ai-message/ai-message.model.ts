import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAIMessage extends Document {
    role: 'AI' | 'CUSTOMER';
    conversationId: Types.ObjectId | string;
    content: string;
    createdAt: Date;
    updatedAt: Date,
}

const schema = new Schema<IAIMessage>(
    {
        role: {
            type: String,
            enum: ['AI', 'CUSTOMER'],
            required: true,
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'AIConversationSession',
            required: true,
        },
        content: {
          type: String,
          required: true,
        }
    },
    { timestamps: true }
);

export const AIMessageModel = mongoose.model(
    'AIMessage',
    schema,
    'ai-messages'
);
