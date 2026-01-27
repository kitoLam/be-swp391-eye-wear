import z from "zod";
import { CheckoutSource } from "../../config/enums/checkout.enum";
import { OrderProductClientCreateSchema } from "../order/order-product";

export const CheckoutSessionCreateSchema = z.object({
  source: z.enum(CheckoutSource),
  products: z.array(OrderProductClientCreateSchema).min(1, 'At least one product is required'),
});

export type CheckoutSessionCreate = z.infer<typeof CheckoutSessionCreateSchema>;