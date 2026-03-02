import z from 'zod';

export const GetShipCodeByInvoiceIdParamsSchema = z.object({
    invoiceId: z.string().min(1, 'invoiceId is required'),
});

export type GetShipCodeByInvoiceIdParams = z.infer<
    typeof GetShipCodeByInvoiceIdParamsSchema
>;

