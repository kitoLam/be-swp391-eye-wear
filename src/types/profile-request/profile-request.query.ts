import z from "zod";
import { BaseQuerySchema } from "../common/base-query";

export const GetProfileRequestListQuerySchema = BaseQuerySchema.extend({});

export type GetProfileRequestListQuery = z.infer<typeof GetProfileRequestListQuerySchema>;