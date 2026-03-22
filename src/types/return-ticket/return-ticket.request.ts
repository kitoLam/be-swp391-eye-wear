import z from "zod";
import { ReturnTicketStatus } from "../../config/enums/return-ticket.enum";

export const CreateReturnTicketSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  reason: z.string().min(1, "Reason is required").max(255),
  description: z.string().min(1, "Description is required").max(255),
  media: z.array(z.string()).optional().default([]),
}).strict();

export type CreateReturnTicketRequest = z.infer<typeof CreateReturnTicketSchema>;

export const ReturnTicketListQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  status: z.nativeEnum(ReturnTicketStatus).optional(),
  orderId: z.string().optional(),
  customerId: z.string().optional(),
  staffVerify: z.string().optional(),
  search: z.string().optional(),
});

export type ReturnTicketListQuery = z.infer<typeof ReturnTicketListQuerySchema>;

export const ApproveRejectReturnTicketSchema = z.object({
  staffNote: z.string().min(1, "Staff note is required"),
});

export type ApproveRejectReturnTicketRequest = z.infer<typeof ApproveRejectReturnTicketSchema>;

