import { Types } from "mongoose";
import z from "zod";
import { ReportTicketPriority, ReportTicketStatus } from "../../config/enums/report-ticket.enum";

const ReportTicketSchema = z.object({
  _id: z.string().or(z.instanceof(Types.ObjectId)),
  title: z.string(),
  description: z.string(),
  priorityLevel: z.enum(ReportTicketPriority),
  imageUrl: z.string(),
  status: z.enum(ReportTicketStatus),
  processedBy: z.string().or(z.instanceof(Types.ObjectId)).nullable(),
  createdBy: z.string().or(z.instanceof(Types.ObjectId)),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type ReportTicket = z.infer<typeof ReportTicketSchema>;