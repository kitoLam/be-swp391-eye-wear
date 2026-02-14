import mongoose, { Document, Schema } from "mongoose";
import { ReportTicket } from "../../types/report-ticket/report-ticket.type";
import { ReportTicketPriority, ReportTicketStatus } from "../../config/enums/report-ticket.enum";

export type IReportTicketDocument = ReportTicket & Document;

const reportTicketSchema = new Schema<IReportTicketDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
  },
  priorityLevel: {
    type: String,
    enum: ReportTicketPriority,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
    default: null,
  },
  status: {
    type: String,
    enum: ReportTicketStatus,
    required: false,
    default: ReportTicketStatus.PENDING,
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: "AdminAccount",
    required: false,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "AdminAccount",
    required: true,
  }
}, {
  timestamps: true
});

export const ReportTicketModel = mongoose.model<IReportTicketDocument>('ReportTicket', reportTicketSchema);