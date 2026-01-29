import z from "zod";
import { OrderProductClientCreateSchema } from "../order/order-product";

export const CheckoutSessionCreateSchema = z.object({
  products: z.array(OrderProductClientCreateSchema).min(1, 'At least one product is required'),
});

export type CheckoutSessionCreate = z.infer<typeof CheckoutSessionCreateSchema>;