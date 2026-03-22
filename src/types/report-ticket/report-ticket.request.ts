import z from "zod";
import { ReportTicketPriority, ReportTicketStatus } from "../../config/enums/report-ticket.enum";
export const CreateReportTicketSchema = z.object({
  title: z.string().nonempty({error: "Title is not allow to be empty"}).max(100),
  description: z.string().max(500).optional(),
  priorityLevel: z.enum(ReportTicketPriority, {error: "Priority category is be LOW or MEDIUM or HIGH or CRITICAL"}),
  imageUrl: z.string().url({error: "ImageUrl is not in url format"}).optional(),
}).strict();

export type CreateReportTicketRequest = z.infer<typeof CreateReportTicketSchema>;