import z from "zod";
import { BaseQuerySchema } from "../common/base-query";
import { ReportTicketPriority, ReportTicketStatus } from "../../config/enums/report-ticket.enum";

export const ReportTicketListQuerySchema = BaseQuerySchema.extend({
  search: z.string().optional().catch(undefined),
  status: z.enum(ReportTicketStatus).optional().catch(undefined),
  priorityLevel: z.enum(ReportTicketPriority).optional().catch(undefined),
  processedBy: z.string().optional().catch(undefined),
});

export type ReportTicketListQuery = z.infer<typeof ReportTicketListQuerySchema>;