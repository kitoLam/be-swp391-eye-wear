export function buildIntentPrompt(message: string) {
    return `
Trích xuất thông tin mua kính từ câu sau.

User message:
"${message}"

Trả về JSON DUY NHẤT theo schema:

{
  "type": "frame | sunglass | null | undefined",
  "gender": "M | F | unisex | null | undefined",
  "priceLower": number | null | undefined,
  "priceUpper": number | null | undefined,
  "color": string | null | undefined,
  "shape": string | null | undefined,
  "isRefinement": boolean
}

Rules:
- Nếu user nói "loại nào cũng được" → để null.
- Nếu user không nhắc đến thì thuộc tính(undefined) đó thì không liệt kê trong object trả về luôn.
- Nếu user đang thay đổi yêu cầu → isRefinement = true.
- Không giải thích. Chỉ trả định dạng JSON.
`;
}
export function buildAnswerPrompt(message: string, products: any[]) {
    const context = products
        .map(p => `${p.nameBase} - ${p.brand ?? 'no brand'} - Link sản phẩm: https://swp391-eye-wear-shop.com/products/${p._id}`)
        .join('\n');

    return `
Bạn là nhân viên bán kính. Hãy giới thiệu từng loại sản phẩm bên dưới cho khách hàng. 

Không hỏi lại thông tin đã đủ.
Không hỏi lại type/gender.
Tư vấn tự nhiên. Để lại những đường link chi tiết sản phẩm để khách hàng biết tìm nó ở đâu.

User:
"${message}"

Products:
${context}
`;
}
