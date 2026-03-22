import { Types } from "mongoose";
import z from "zod";

export const ObjectIdSchema = z.object({
  id: z.string().refine(value => Types.ObjectId.isValid(value), {
    error: 'Invalid ObjectId'
  })
});

export type ObjectIdDTO = z.infer<typeof ObjectIdSchema>;