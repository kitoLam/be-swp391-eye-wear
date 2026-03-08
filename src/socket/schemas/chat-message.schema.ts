import z from "zod";

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message is required'),
  roomChatId: z.string().optional(),
});
export const JoinRoomSchema = z.object({
  roomChatId: z.string().min(1, 'Room ID is required'),
});
export type SendMessageRequest = z.infer<typeof SendMessageSchema>;
export type JoinRoomRequest = z.infer<typeof JoinRoomSchema>;