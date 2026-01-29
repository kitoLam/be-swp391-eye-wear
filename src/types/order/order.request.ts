import z from "zod";
import { LensParametersSchema } from "../lens-parameters/lens-parameters";

// Client side
export const ClientUpdateOrderPrescriptionSchema = z.object({
    invoiceId: z.string().nonempty('Invoice ID is required'),
    lensParameter: LensParametersSchema,
});

// Client-specific type exports
export type ClientUpdateOrder = z.infer<typeof ClientUpdateOrderPrescriptionSchema>;
