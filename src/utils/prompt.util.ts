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

export function buildAnswerPrompt(message: string, products: any[]) {
    const context = products
        .map((p, index) => {
            const variantPrice = Array.isArray(p.variants)
                ? p.variants
                      .filter((v: any) => v?.deletedAt == null)
                      .map((v: any) => v.finalPrice ?? v.price)
                : [];

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

            return `${index + 1}. ${p.nameBase}\n- Brand: ${p.brand ?? 'no brand'}\n- Type: ${p.type}\n- Spec: ${JSON.stringify(p.spec ?? {})}\n- Giá tham khảo: ${priceRange}\n- Link sản phẩm: https://eyewear-optic.shop/products/${p._id}`;
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
- Không hỏi lại type/gender nếu đã có.
- Nếu không có sản phẩm phù hợp thì xin lỗi và đề nghị khách nới điều kiện.
- Mỗi sản phẩm gợi ý cần nêu lý do phù hợp ngắn gọn.
- Luôn kèm link chi tiết đúng theo dữ liệu đã cho.

User:
"${message}"

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
