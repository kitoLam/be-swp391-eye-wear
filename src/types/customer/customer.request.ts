import z from "zod";
import { AddressSchema } from "./address";
import { LensParametersSchema } from "../lens-parameters/lens-parameters";

export const UpdateCustomerProfileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50).regex(/^[\p{L}\s]+$/u, 'Name must only contain letters'),
    phone: z.string()
        .min(1, 'Phone number is required')
        .regex(/^(0[2|3|5|7|8|9])+([0-9]{8})$/, 'Invalid Vietnamese phone number format'),
    gender: z.enum(['F', 'M', 'N']),
    hobbies: z.array(z.string()).optional()
}).strict();
export const UpdateCustomerPasswordSchema = z.object({
    oldPassword: z.string().nonempty({error: "Password is required"}).optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).strict()
export const AddCustomerAddressSchema = z.object({
    street: z.string().min(1, 'Street is required'),
    ward: z.string().min(1, 'Ward is required'),
    city: z.string().min(1, 'City is required'),
    isDefault: z.boolean().default(false),
}).strict()

export const UpdateCustomerAddressSchema = z.object({
    street: z.string().min(1, 'Street is required'),
    ward: z.string().min(1, 'Ward is required'),
    city: z.string().min(1, 'City is required'),
    isDefault: z.boolean().default(false),
}).strict()

export const AddCustomerPrescriptionSchema = z.object({
        left: z.object({
            SPH: z.number(),
            CYL: z.number(),
            AXIS: z.number(),
            ADD: z.number()
        }),
        right: z.object({
            SPH: z.number(),
            CYL: z.number(),
            AXIS: z.number(),
            ADD: z.number()
        }),
        PD: z.number(),
        isDefault: z.boolean().default(false),
    }).strict()

export const UpdateCustomerPrescriptionSchema = z.object({
        left: z.object({
            SPH: z.number(),
            CYL: z.number(),
            AXIS: z.number(),
            ADD: z.number()
        }),
        right: z.object({
            SPH: z.number(),
            CYL: z.number(),
            AXIS: z.number(),
            ADD: z.number()
        }),
        PD: z.number(),
        isDefault: z.boolean().default(false),
    }).strict()

export type UpdateCustomerProfileRequest = z.infer<typeof UpdateCustomerProfileSchema>;
export type AddCustomerPrescription = z.infer<typeof AddCustomerPrescriptionSchema>;
export type UpdateCustomerPrescription = z.infer<typeof UpdateCustomerPrescriptionSchema>;
export type AddCustomerAddress = z.infer<typeof AddCustomerAddressSchema>;
export type UpdateCustomerAddress = z.infer<typeof UpdateCustomerAddressSchema>;
export type UpdateCustomerPassword = z.infer<typeof UpdateCustomerPasswordSchema>;