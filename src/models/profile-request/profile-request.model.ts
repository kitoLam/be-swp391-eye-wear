import mongoose, { Document, Schema } from "mongoose";
import { ProfileRequest } from "../../types/profile-request/profile-request.type";
import { ProfileRequestStatus } from "../../config/enums/profile-request.enum";

export type IProfileRequestDocument = ProfileRequest & Document;

const profileRequestSchema = new Schema<IProfileRequestDocument>({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'AdminAccount',
    required: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
    required: true,
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminAccount',
    required: false,
    default: null,
  },
  processedAt: {
    type: Date,
    required: false,
    default: null,  
  },
  status: {
    type: String,
    enum: ProfileRequestStatus,
    default: ProfileRequestStatus.PENDING
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminAccount',
    required: false,
    default: null, 
  },
  deletedAt: {
    type: Date,
    default: null, 
  }
}, {
  timestamps: true
});

export const ProfileRequestModel = mongoose.model<IProfileRequestDocument>('ProfileRequest', profileRequestSchema);