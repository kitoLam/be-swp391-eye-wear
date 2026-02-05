import z from "zod";

export const InvoiceAssignHandleDeliverySchema = z.object({
  assignedStaff: z.string().min(1, 'Staff ID is required'),
});

export type InvoiceAssignHandleDeliveryRequest = z.infer<typeof InvoiceAssignHandleDeliverySchema>;