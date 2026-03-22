import z from "zod";

export const InvoiceAssignHandleDeliverySchema = z.object({
  assignedStaff: z.string().min(1, 'Staff ID is required'),
}).strict();
export const RejectInvoiceSchema = z.object({
  note: z.string().max(500).optional(),
}).strict();
export type InvoiceAssignHandleDeliveryRequest = z.infer<typeof InvoiceAssignHandleDeliverySchema>;
export type RejectInvoiceRequest = z.infer<typeof RejectInvoiceSchema>;