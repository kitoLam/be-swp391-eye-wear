import z from "zod";
import { InvoiceStatus } from "../../config/enums/invoice.enum";

export const InvoiceListQuerySchema = z.object({
    page: z.coerce.number().min(1).catch(1),
    limit: z.coerce.number().min(1).max(50).catch(10),
    status: z.enum(InvoiceStatus).optional().catch(undefined),
    search: z.string().optional().catch(undefined),
});
export type InvoiceListQuery = z.infer<typeof InvoiceListQuerySchema>;