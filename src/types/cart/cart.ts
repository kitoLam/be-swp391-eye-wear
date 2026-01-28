import z from 'zod';
import { CartItemSchema } from './cart-item';
import { Types } from 'mongoose';

// Cart Schema
export const CartSchema = z.object({
    _id: z.string().or(z.instanceof(Types.ObjectId)),
    owner: z.string().or(z.instanceof(Types.ObjectId)),
    products: z.array(CartItemSchema),
    totalProduct: z
        .number()
        .int()
        .min(0, 'Total product must be non-negative')
        .default(0),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});


export type Cart = z.infer<typeof CartSchema>;