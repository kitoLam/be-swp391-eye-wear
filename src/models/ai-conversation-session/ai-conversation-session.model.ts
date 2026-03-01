import mongoose, { Schema, Document, Types } from "mongoose";

export interface IConversationSession extends Document {
  customerId: Types.ObjectId;

  intent: {
    type?: "frame" | "sunglass" | "lens";
    gender?: "male" | "female" | "unisex";
    priceLower?: number;
    priceUpper?: number;
    color?: string;
    shape?: string;
    style?: string;
    brand?: string;
    feature?: string;
  };

  stage: "DISCOVERY" | "RECOMMENDING" | "REFINING";

  lastInteractionAt: Date; 
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IConversationSession>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
    intent: { type: Object, default: {} },
    stage: { type: String, default: "DISCOVERY" },
    lastInteractionAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const AIConversationSessionModel = mongoose.model(
  "AIConversationSession",
  schema,
  "ai-conversation-sessions"
);