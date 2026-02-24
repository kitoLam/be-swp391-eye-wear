import mongoose, { Schema, Document } from "mongoose";

export interface IConversationSession extends Document {
  customerId: string;

  intent: {
    type?: "frame" | "sunglass";
    gender?: "male" | "female" | "unisex";
    priceLower?: number;
    priceUpper?: number;
    color?: string;
    shape?: string;
  };

  stage: "DISCOVERY" | "RECOMMENDING" | "REFINING";

  lastInteractionAt: Date; 
}

const schema = new Schema<IConversationSession>(
  {
    customerId: { type: String, required: true, unique: true },
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