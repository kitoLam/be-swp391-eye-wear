import z from 'zod';
import { AddressSchema } from './address';
import { Types } from 'mongoose';

// Customer Schema
export const CustomerSchema = z.object({
    _id: z.string().or(z.instanceof(Types.ObjectId)),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    hashedPassword: z.string().min(1, 'Password is required'),
    phone: z.string().min(1, 'Phone number is required'),
    gender: z.enum(['F', 'M', 'N']),
    address: z.array(z.object({
        street: z.string().min(1, 'Street is required'),
        ward: z.string().min(1, 'Ward is required'),
        city: z.string().min(1, 'City is required'),
        isDefault: z.boolean().default(false),
    })).default([]),
    parameters: z.array(z.object({
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
    })).default([]),
    hobbies: z.array(z.string()).default([]),
    isVerified: z.boolean().default(false),
    providers: z.array(z.string()),
    googleId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
    deletedBy: z.string().or(z.instanceof(Types.ObjectId)).nullable()
});

// Create Customer Schema (for registration/creation)
export const CreateCustomerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().nonempty('Email is required').email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(1, 'Phone number is required'),
    gender: z.enum(['F', 'M', 'N'], {error: "Please choose a gender!"}),
    address: z.array(AddressSchema).min(0),
    hobbies: z.array(z.string()).min(0)
}).strict();

// Update Customer Schema (for updating existing customer)
export const UpdateCustomerSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email format').optional(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .optional(),
    phone: z.string().min(1, 'Phone number is required').optional(),
    gender: z.enum(['F', 'M', 'N']).optional(),
    address: z.array(AddressSchema).optional(),
    hobbies: z.array(z.string()).optional(),
    isVerified: z.boolean().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;
