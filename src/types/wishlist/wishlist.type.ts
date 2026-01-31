import { Types } from "mongoose";
import z from "zod";

export const WishlistSchema = z.object({
  _id: z.instanceof(Types.ObjectId).or(z.string()),
  owner: z.instanceof(Types.ObjectId).or(z.string()),
  products: z.array(z.object({
    productId: z.instanceof(Types.ObjectId),
    addedAt: z.date()
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Wishlist = z.infer<typeof WishlistSchema>;