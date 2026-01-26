import z from "zod";
import { InvoiceStatus } from "../../config/enums/invoice.enum";

export const InvoiceVerifyParams = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
  status: z.enum([InvoiceStatus.APPROVED, InvoiceStatus.REJECTED], {error: "Status must be approved or rejected"}),
}).strict();

export type InvoiceVerifyParams = z.infer<typeof InvoiceVerifyParams>;