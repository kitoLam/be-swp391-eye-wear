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
export const ApproveOrderSchema = z.object({
    parameters: LensParametersSchema,
    note: z.string().max(500, 'Note must not exceed 500 characters').optional(),
});

export const AssignOrderSchema = z.object({
    assignedStaff: z.string().nonempty('Staff ID is required').refine(v => Types.ObjectId.isValid(v), 'Staff ID is not valid'),
});
export type AssignOrderDTO = z.infer<typeof AssignOrderSchema>;
export type ApproveOrderDTO = z.infer<typeof ApproveOrderSchema>;
// ========= End Admin Request Schema ==============