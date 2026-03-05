import mongoose from 'mongoose';
import { connectMongoDB } from '../config/database/mongodb.config';
import {
    EMBEDDING_MODEL_NAME,
    embeddingModel,
} from '../config/google-gemini-ai.config';
import { ProductModel } from '../models/product/product.model.mongo';

type PlainObject = Record<string, unknown>;

type ChatCompletionResponse = {
    choices?: Array<{
        message?: {
            role?: string;
            content?: string | Array<{ type?: string; text?: string }>;
        };
    }>;
};

const REQUEST_DELAY_MS = 1200;
const MAX_RETRIES = 5;
const DESCRIPTION_MAX_RETRIES = 3;

const DESCRIPTION_API_BASE_URL =
    process.env.AISHOP24H_BASE_URL ?? 'https://aishop24h.com/v1';
const DESCRIPTION_MODEL =
    process.env.AISHOP24H_MODEL ?? 'google/gemini-2.0-flash-lite';
const DESCRIPTION_API_KEY = process.env.AISHOP24H_API_KEY;

let hasLoggedMissingDescriptionApiKey = false;

function removeIgnoredKeys(value: unknown): unknown {
    const ignoredKeys = new Set([
        'createdAt',
        'updatedAt',
        'deletedAt',
        'embedding',
        'embeddingModel',
        'embeddingUpdatedAt',
        '__v',
    ]);

    if (Array.isArray(value)) {
        return value.map(item => removeIgnoredKeys(item));
    }

    if (value !== null && typeof value === 'object') {
        const obj = value as PlainObject;
        const filtered: PlainObject = {};

        for (const [key, child] of Object.entries(obj)) {
            if (ignoredKeys.has(key)) {
                continue;
            }
            filtered[key] = removeIgnoredKeys(child);
        }

        return filtered;
    }

    return value;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
    const status = (error as { status?: number })?.status;
    return status === 429 || status === 503 || status === 502;
}

function normalizeChatContent(
    content: string | Array<{ type?: string; text?: string }> | undefined
): string {
    if (typeof content === 'string') {
        return content.trim();
    }

    if (Array.isArray(content)) {
        return content
            .map(item => item.text ?? '')
            .join(' ')
            .trim();
    }

    return '';
}

function buildLocalDescription(product: PlainObject): string {
    const nameBase = (product.nameBase as string | undefined) ?? 'Sản phẩm';
    const slugBase =
        (product.slugBase as string | undefined) ?? 'không rõ slug';
    const skuBase = (product.skuBase as string | undefined) ?? 'không rõ SKU';
    const brand =
        (product.brand as string | undefined) ?? 'không rõ thương hiệu';
    const type = (product.type as string | undefined) ?? 'không rõ loại';

    const categories = Array.isArray(product.categories)
        ? (product.categories as unknown[])
        : [];
    const categoryText =
        categories.length > 0
            ? categories.map(item => String(item)).join(', ')
            : 'không có category';

    const spec = product.spec;
    const specText = spec ? JSON.stringify(spec) : 'không có spec';

    const variants = Array.isArray(product.variants)
        ? (product.variants as PlainObject[])
        : [];

    const variantsText =
        variants.length > 0
            ? variants
                  .map((variant, index) => {
                      const variantName =
                          (variant.name as string | undefined) ??
                          `variant-${index + 1}`;
                      const variantSku =
                          (variant.sku as string | undefined) ?? 'không rõ SKU';
                      const variantSlug =
                          (variant.slug as string | undefined) ??
                          'không rõ slug';
                      const mode =
                          (variant.mode as string | undefined) ??
                          'không rõ trạng thái';

                      const stock =
                          typeof variant.stock === 'number'
                              ? variant.stock
                              : 'không rõ tồn kho';

                      const finalPrice =
                          typeof variant.finalPrice === 'number'
                              ? `${variant.finalPrice.toLocaleString('vi-VN')}đ`
                              : 'không rõ giá khuyến mãi';

                      const originPrice =
                          typeof variant.price === 'number'
                              ? `${variant.price.toLocaleString('vi-VN')}đ`
                              : 'không rõ giá gốc';

                      const options = Array.isArray(variant.options)
                          ? (variant.options as PlainObject[])
                          : [];

                      const optionText =
                          options.length > 0
                              ? options
                                    .map(option => {
                                        const attributeName =
                                            (option.attributeName as
                                                | string
                                                | undefined) ?? 'Thuộc tính';
                                        const label =
                                            (option.label as
                                                | string
                                                | undefined) ?? 'không rõ';
                                        const rawValue = option.value as
                                            | string
                                            | number
                                            | PlainObject
                                            | undefined;
                                        const value =
                                            typeof rawValue === 'object' &&
                                            rawValue !== null
                                                ? JSON.stringify(rawValue)
                                                : rawValue ?? 'không rõ';
                                        return `${attributeName}: ${label} (${value})`;
                                    })
                                    .join(', ')
                              : 'không có option';

                      return `${variantName} [sku: ${variantSku}, slug: ${variantSlug}, mode: ${mode}, stock: ${stock}, finalPrice: ${finalPrice}, price: ${originPrice}, options: ${optionText}]`;
                  })
                  .join('; ')
            : 'không có variant';

    return `Sản phẩm ${nameBase} thuộc thương hiệu ${brand}, loại ${type}, slugBase ${slugBase}, skuBase ${skuBase}. Categories: ${categoryText}. Spec: ${specText}. Danh sách variants: ${variantsText}.`;
}

async function generateNaturalDescription(
    product: PlainObject
): Promise<string> {
    if (!DESCRIPTION_API_KEY) {
        if (!hasLoggedMissingDescriptionApiKey) {
            hasLoggedMissingDescriptionApiKey = true;
            console.warn(
                '[WARN] Missing AISHOP24H_API_KEY. Fallback to local description template.'
            );
        }
        return buildLocalDescription(product);
    }

    const url = `${DESCRIPTION_API_BASE_URL.replace(
        /\/$/,
        ''
    )}/chat/completions`;

    const prompt = [
        'Dựa trên dữ liệu JSON sản phẩm bên dưới, hãy viết đúng 1 đoạn mô tả tiếng Việt tự nhiên như người tư vấn bán hàng.',
        'Yêu cầu bắt buộc:',
        '- Phải liệt kê đầy đủ tất cả variants, không bỏ sót variant nào.',
        '- Với mỗi variant: nêu name, sku, slug, mode, stock, price, finalPrice.',
        '- Với mỗi variant: liệt kê toàn bộ options gồm attributeName, label, value (nếu có).',
        '- Nêu rõ thông tin gốc của product: nameBase, slugBase, skuBase, brand, type, categories, spec.',
        '- Nếu có dữ liệu về tròng kính/lens (ví dụ độ cận, loạn, chiết suất, lớp phủ, màu tròng...), phải nêu đầy đủ theo đúng JSON.',
        '- Đặc biệt nếu spec có feature hoặc material (ví dụ công nghệ đổi màu, chống ánh sáng xanh...), phải đưa rõ vào mô tả để tối ưu search theo chức năng.',
        '- Không bịa thêm thông tin không có trong JSON.',
        '- Hãy tìm kiếm và phân tích đưa ra thông tin phù hợp với khuôn mặt',
        '- Trả về duy nhất đoạn mô tả, không markdown, không bullet.',
        '- Các variants hay options có những options color attribute thì có các màu hơi đặc biệt chút như Prizm Rudy chẳng hạn thì bạn hãy tự động nhận biết màu gần giống nhất, ví dụ bạn có thể nói đó là màu Prizm Ruby(đỏ, red)',
        '',
        'JSON sản phẩm:',
        JSON.stringify(product, null, 2),
    ].join('\n');

    let lastError: unknown;

    for (let attempt = 1; attempt <= DESCRIPTION_MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${DESCRIPTION_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: DESCRIPTION_MODEL,
                    temperature: 0.3,
                    messages: [
                        {
                            role: 'system',
                            content:
                                'Bạn là chuyên gia viết mô tả sản phẩm thương mại điện tử bằng tiếng Việt.',
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const error = new Error(
                    `Description API request failed with status ${response.status}`
                ) as Error & { status?: number };
                error.status = response.status;
                throw error;
            }

            const payload = (await response.json()) as ChatCompletionResponse;
            const assistantChoice = payload.choices?.find(
                choice => choice.message?.role === 'assistant'
            );
            const content = normalizeChatContent(
                assistantChoice?.message?.content ??
                    payload.choices?.[0]?.message?.content
            );

            if (!content) {
                throw new Error('Description API returned empty content');
            }

            return content;
        } catch (error) {
            lastError = error;

            if (
                !isRetryableError(error) ||
                attempt === DESCRIPTION_MAX_RETRIES
            ) {
                console.warn(
                    '[WARN] Description API failed, using local description template.'
                );
                return buildLocalDescription(product);
            }

            const backoffMs = REQUEST_DELAY_MS * attempt;
            console.warn(
                `[RETRY] Description attempt ${attempt}/${DESCRIPTION_MAX_RETRIES} failed. Waiting ${backoffMs}ms...`
            );
            await sleep(backoffMs);
        }
    }

    if (lastError) {
        console.warn('[WARN] Description API exhausted retries:', lastError);
    }
    return buildLocalDescription(product);
}

async function buildEmbeddingText(product: unknown): Promise<string> {
    const cleaned = removeIgnoredKeys(product) as PlainObject;
    const keyValueData = JSON.stringify(cleaned, null, 2);
    const naturalDescription = await generateNaturalDescription(cleaned);

    return [
        'PRODUCT_KEY_VALUE_DATA:',
        keyValueData,
        '',
        'PRODUCT_NATURAL_DESCRIPTION:',
        naturalDescription,
    ].join('\n');
}

async function getEmbeddingVector(text: string): Promise<number[]> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await embeddingModel.embedContent(text);
            const values = (result as { embedding?: { values?: unknown } })
                ?.embedding?.values;

            if (!Array.isArray(values) || values.length === 0) {
                throw new Error('Embedding result is empty or invalid');
            }

            return values as number[];
        } catch (error) {
            lastError = error;

            if (!isRetryableError(error) || attempt === MAX_RETRIES) {
                throw error;
            }

            const backoffMs = REQUEST_DELAY_MS * attempt;
            console.warn(
                `[RETRY] Embed attempt ${attempt}/${MAX_RETRIES} failed. Waiting ${backoffMs}ms...`
            );
            await sleep(backoffMs);
        }
    }

    throw lastError;
}

async function embedAllProducts(): Promise<void> {
    await connectMongoDB();

    const products = await ProductModel.find({ deletedAt: null }).lean();
    console.log(`Found ${products.length} products to embed.`);

    let successCount = 0;
    let failedCount = 0;

    for (const product of products) {
        const productId = product._id.toString();

        try {
            const text = await buildEmbeddingText(product);
            const vector = await getEmbeddingVector(text);

            await ProductModel.updateOne(
                { _id: product._id },
                {
                    $set: {
                        embedding: vector,
                        embeddingModel: EMBEDDING_MODEL_NAME,
                        embeddingUpdatedAt: new Date(),
                    },
                }
            );

            successCount += 1;
            console.log(
                `[OK] Embedded product ${productId} (${successCount}/${products.length})`
            );
        } catch (error) {
            failedCount += 1;
            console.error(`[FAILED] Product ${productId}:`, error);
        }

        await sleep(REQUEST_DELAY_MS);
    }

    console.log(`Done. Success: ${successCount}, Failed: ${failedCount}`);
}

void (async () => {
    try {
        await embedAllProducts();
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Embedding job failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
})();
