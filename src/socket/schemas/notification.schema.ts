import z from "zod";

export const CreateInvoiceSuccessSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
});
export const AssignOrderSchema = z.object({
  orderId: z.string().min(1, 'Invoice ID is required'),
});
export const AssignInvoiceSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
});
export const CompleteInvoiceSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
});
export type AssignOrder = z.infer<typeof AssignOrderSchema>;
export type AssignInvoice = z.infer<typeof AssignInvoiceSchema>;
export type CreateInvoiceSuccess = z.infer<typeof CreateInvoiceSuccessSchema>;
export type CompleteInvoice = z.infer<typeof CompleteInvoiceSchema>;