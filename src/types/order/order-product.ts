import z from 'zod';
import { LensParametersSchema } from './lens-parameters';

// Order Product Lens Schema
export const OrderProductLensSchema = z.object({
    lens_id: z.string().min(1, 'Lens ID is required'),
    parameters: LensParametersSchema,
    // Quantity của lens thường đi theo cặp hoặc bằng sl gọng, nhưng ở đây có thể optional hoặc required tùy business.
    // Giữ nguyên quantity cho lens nếu lens tracking riêng.
    quantity: z
        .number()
        .int()
        .min(1, 'Quantity must be at least 1')
        .optional()
        .default(1),
});

// Order Product Schema
export const OrderProductSchema = z.object({
    // Đổi tên frames -> product_id để generic hơn (có thể là Sunglasses, Frames, v.v)
    // Nhưng để backwards compatible hoặc rõ ràng, ta có thể giữ frames hoặc thêm product_id.
    // User request: "order chỉ là gọng kính hoặc kính sunglass" -> gọi chung là product_id hợp lý hơn
    // Tuy nhiên DB cũ đang dùng "frames". Tôi sẽ đổi thành "product_id" và map trong service nếu cần,
    // hoặc update model DB. User nói "đây là database của order... frames: string".
    // Tạm thời giữ "frames" để khớp với DB Model hiện tại user cung cấp,
    // NHƯNG tốt nhất nên refactor thành `product_id`.
    // Tôi sẽ dùng `product_id` trong DTO và map vào DB, hoặc update DB field.
    // Quyết định: Update field thành product_id cho chuẩn.
    product_id: z.string().min(1, 'Product ID is required'),

    quantity: z.number().int().min(1, 'Quantity must be at least 1'),

    lens: OrderProductLensSchema.optional(), // Lens is now OPTIONAL
});

export type OrderProductLens = z.infer<typeof OrderProductLensSchema>;
export type OrderProduct = z.infer<typeof OrderProductSchema>;
