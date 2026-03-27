export function buildIntentPrompt(message: string) {
    return `
Trích xuất thông tin mua kính từ câu sau.

User message:
"${message}"

Trả về JSON DUY NHẤT theo schema:

{
  "type": "frame | sunglass | lens " |  null | undefined,
  "gender": "M | F | unisex " | null | undefined,
  "priceLower": number | null | undefined,
  "priceUpper": number | null | undefined,
  "color": string | null | undefined,
  "shape": string | null | undefined,
  "style": string | undefined,
  "brand": string | undefined,
  "feature": string | undefined,
  "isRefinement": boolean
}

Rules:
- Nếu user nói "loại nào cũng được" → để null.
- Nếu user không nhắc đến thì thuộc tính(undefined) đó thì không liệt kê trong object trả về luôn.
- Nếu user đang thay đổi yêu cầu → isRefinement = true.
- Không giải thích. Chỉ trả định dạng JSON.
- Để lên các field này dạng tiếng anh (English) nha
`;
}

export function buildAnswerPrompt(paraphrasedIntent: string, products: any[]) {
    const context = products
        .map((p, index) => {
            const validVariants = Array.isArray(p.variants)
                ? p.variants.filter((v: any) => v?.deletedAt == null)
                : [];

            const variantPrice = validVariants.map(
                (v: any) => v.finalPrice ?? v.price
            );

            const minPrice = variantPrice.length
                ? Math.min(...variantPrice)
                : null;
            const maxPrice = variantPrice.length
                ? Math.max(...variantPrice)
                : null;

            const priceRange =
                minPrice != null && maxPrice != null
                    ? `${minPrice} - ${maxPrice}`
                    : 'Chưa có dữ liệu giá';

            const spec = p.spec ?? {};
            const faceShapeInfo =
                spec.faceShape ??
                spec.faceShapes ??
                spec.suitableFaceShape ??
                spec.suitableFaceShapes ??
                spec.fitFaceShape ??
                spec.fitFaceShapes ??
                spec.shape ??
                null;

            const variantSummary = validVariants
                .map((v: any) => {
                    const options = Array.isArray(v.options) ? v.options : [];
                    const optionText = options
                        .map((o: any) => {
                            const attribute = (
                                o?.attributeName ?? ''
                            ).toString();
                            const label = (o?.label ?? '').toString();
                            const value = (o?.value ?? '').toString();
                            const showType = (o?.showType ?? '').toString();
                            return `${attribute}=${label}${
                                value ? `(${value})` : ''
                            }${showType ? `[${showType}]` : ''}`;
                        })
                        .join(', ');

                    return `sku=${v.sku}, mode=${v.mode}, stock=${
                        v.stock
                    }, price=${v.price}, finalPrice=${v.finalPrice}, options=[${
                        optionText || 'none'
                    }]`;
                })
                .join(' | ');

            return `${index + 1}. ${p.nameBase}\n- Brand: ${
                p.brand ?? 'no brand'
            }\n- Type: ${p.type}\n- Product name/slug gốc: ${
                p.nameBase ?? ''
            } / ${p.slugBase ?? ''}\n- Spec: ${JSON.stringify(
                spec
            )}\n- Face-shape data (nếu có): ${JSON.stringify(
                faceShapeInfo
            )}\n- Giá tham khảo: ${priceRange}\n- Variants chi tiết: ${
                variantSummary || 'không có variant'
            }\n- Link sản phẩm: https://eyewear-optic.shop/products/${p._id}`;
        })
        .join('\n\n');

    return `
Bạn là nhân viên tư vấn bán kính cho cửa hàng eyewear.

Mục tiêu:
- Tư vấn NGẮN GỌN, tự nhiên, đúng nhu cầu khách.
- Chỉ dùng dữ liệu sản phẩm được cung cấp trong phần Products.
- Không bịa thông tin ngoài dữ liệu.

Rules:
- Không hỏi lại thông tin đã đủ.
- Recommend đủ hết tất cả sản phẩm gửi lên
- Nếu không có sản phẩm phù hợp thì xin lỗi và đề nghị khách nới điều kiện.
- Mỗi sản phẩm gợi ý cần nêu lý do phù hợp ngắn gọn.
- Luôn kèm link chi tiết đúng theo dữ liệu đã cho.
- Ưu tiên dùng spec.shape để tư vấn độ phù hợp khuôn mặt khi khách có yêu cầu về face shape.
- Có thể dùng quy tắc tư vấn phổ biến sau khi spec.shape đã có: round → ưu tiên square/rectangle/cat-eye; square → ưu tiên round/oval; oval → đa số shape phù hợp; heart → ưu tiên oval/round/aviator.
- Nếu spec.shape trùng hoặc gần trùng với nhu cầu khuôn mặt khách, hãy nói rõ "phù hợp" và nêu lý do ngắn.
- Nếu spec.shape không trùng nhu cầu, nói "chưa tối ưu bằng" thay vì phủ định tuyệt đối.
- Chỉ khi thiếu spec.shape và không có dữ liệu face-shape khác thì mới nói: "chưa đủ dữ liệu shape trong sản phẩm để kết luận chính xác".
- Không được nói "không có màu X" nếu trong variants/options có label hoặc value thể hiện màu đó (ví dụ Red, #FF0000, đỏ).

Customer Intent Summary:
"${paraphrasedIntent}"

Product Length: ${products.length}

Products:
${context}
`;
}

export function buildAskSlotPrompt(
    missingSlot: string,
    currentIntent: Record<string, any>,
    userMessage: string
) {
    return `
Bạn là nhân viên tư vấn kính mắt đang trò chuyện với khách.

Khách vừa nói:
"${userMessage}"

Hệ thống chưa đủ thông tin để tìm sản phẩm.

Thông tin còn thiếu:
${missingSlot}

Thông tin đã biết (để bạn KHÔNG hỏi lại):
${JSON.stringify(currentIntent)}

Nhiệm vụ của bạn:
- Hỏi NGẮN GỌN để lấy đủ thông tin còn thiếu.
- Không hỏi lại thông tin đã có.
- Không giải thích dài dòng.
- Không liệt kê kỹ thuật.
- Chỉ hỏi như nhân viên bán hàng thật (1 câu tự nhiên).
- Không nói bạn là AI.

Chỉ trả về câu hỏi.
`;
}

export function buildIntentClassificationPrompt(messageHistory: string) {
    return `
Bạn là trợ lý AI phân loại ý định khách hàng.

Lịch sử chat gần đây:
${messageHistory}

Phân loại câu hỏi/yêu cầu cuối cùng của khách vào 1 trong 2 loại:

1. SHOPPING: Khách muốn tìm/mua/được tư vấn sản phẩm kính (gọng kính, kính râm, tròng kính)
   VD: "Tìm kính râm nam", "Có kính gì giá rẻ không", "Muốn mua gọng kính Rayban", "Xem kính nữ đẹp"

2. INFO: Khách hỏi thông tin chung về shop, chính sách, dịch vụ, hoặc chào hỏi
   VD: "Shop mở cửa mấy giờ?", "Có ship hàng không?", "Địa chỉ shop ở đâu?", "Xin chào", "Bảo hành như thế nào?"

Trả về JSON duy nhất:
{
  "intentType": "SHOPPING" | "INFO",
  "confidence": "high" | "medium" | "low"
}

Không giải thích. Chỉ trả JSON.
`;
}

export function buildInfoResponsePrompt(messageHistory: string) {
    return `
Bạn là nhân viên tư vấn của shop kính Optic View.

Thông tin shop:
- Tên shop: Optic View
- Địa chỉ: Nhà Văn hóa sinh viên, Quận 9, TP. HCM
- Giờ mở cửa: 9:00 - 21:00 (Thứ 2 - Chủ nhật)
- Hotline: 1900 xxxx
- Dịch vụ: Bán kính gọng, kính râm, tròng kính. Có dịch vụ đo mắt và cắt kính theo yêu cầu
- Thanh toán: Tiền mặt, chuyển khoản, thẻ
- Giao hàng: Giao hàng toàn quốc với đồng giá shop 10.000 VND

KHÁCH GHI: 
${messageHistory}

Nhiệm vụ:
- Trả lời NGẮN GỌN, TỰ NHIÊN câu hỏi của khách
- CÓ THỂ LẤY 1 TRONG NHỮNG THÔNG TIN Ở TRÊN TÔI ĐÃ CUNG CẤP NẾU CẦN CÒN KHÔNG THÌ ĐỪNG CUNG CẤP CHO KHÁCH
- Chỉ dùng thông tin đã cung cấp ở trên
- Nếu không biết thông tin, hãy lịch sự xin lỗi và đề nghị khách liên hệ hotline
- Không nói bạn là AI
- Giọng điệu thân thiện, chuyên nghiệp
- QUAN TRỌNG: KHÔNG TRẢ LỜI NHỮNG THỨ THỪA THẢI, VÍ DỤ KHÁCH HỎI XIN CHÀO THÌ CHỈ CẦN TRẢ LỜI LẠI KHÁCH KHÔNG CẦN HIỆN THÔNG TIN GÌ THÊM
Chỉ trả về câu trả lời.
`;
}
