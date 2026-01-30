import z from "zod";
import { LensParametersSchema } from "../lens-parameters/lens-parameters";
import { Types } from "mongoose";

// ========= Client Request Schema ==============
export const ClientUpdateOrderPrescriptionSchema = z.object({
    invoiceId: z.string().nonempty('Invoice ID is required'),
    lensParameter: LensParametersSchema,
});

export type ClientUpdateOrder = z.infer<typeof ClientUpdateOrderPrescriptionSchema>;

// ========= End Client Request Schema ==============

// ========= Admin Request Schema ==================
export const AssignOrderSchema = z.object({
    assignedStaff: z.string().nonempty('Staff ID is required').refine(v => Types.ObjectId.isValid(v), 'Staff ID is not valid'),
});
export type AssignOrderDTO = z.infer<typeof AssignOrderSchema>;
// ========= End Admin Request Schema ==============