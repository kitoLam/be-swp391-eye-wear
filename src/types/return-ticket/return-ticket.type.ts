import { Types } from "mongoose";
import z from "zod";
import { ReturnTicketStatus } from "../../config/enums/return-ticket.enum";

const ReturnTicketSchema = z.object({
  _id: z.string().or(z.instanceof(Types.ObjectId)),
  orderId: z.string(),
  customerId: z.string().or(z.instanceof(Types.ObjectId)),
  reason: z.string(),
  description: z.string(),
  media: z.array(z.string()),
  /**
   * Optional list of SKU(s) in case order NORMAL has multiple products.
   * Nullable for backward compatibility.
   */
  skus: z.array(z.string()).nullable().optional(),
  staffVerify: z.string().or(z.instanceof(Types.ObjectId)).nullable(),
  status: z.enum(ReturnTicketStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type ReturnTicket = z.infer<typeof ReturnTicketSchema>;

