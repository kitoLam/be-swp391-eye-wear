import { Types } from "mongoose";
import z from "zod";
import { ProfileRequestStatus } from "../../config/enums/profile-request.enum";

export const ProfileRequestSchema = z.object({
  staffId: z.string().or(z.instanceof(Types.ObjectId)),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  processedBy: z.string().or(z.instanceof(Types.ObjectId)),
  processedAt: z.date().nullable(),
  deletedBy: z.string().or(z.instanceof(Types.ObjectId)),
  deletedAt: z.date(),
  status: z.enum(ProfileRequestStatus, {error: "Profile request status is invalid"}),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type ProfileRequest = z.infer<typeof ProfileRequestSchema>;