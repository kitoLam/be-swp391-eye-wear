import { FilterQuery } from 'mongoose';
import { redisPrefix } from '../../config/constants/redis.constant';
import { CheckoutSource } from '../../config/enums/checkout.enum';
import {
    ProductType,
    ProductVariantMode,
} from '../../config/enums/product.enum';
import {
    BadRequestError,
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { productRepository } from '../../repositories/product/product.repository';
import { OrderProductClientCreate } from '../../types/order/order-product';
import { ProductConfigManufacturing } from '../../types/product/product/product.dto';
import redisService from '../redis.service';
import cartService from './cart.service';
import { Product } from '../../types/product/product/product';
import {
    IProductDocument,
    ProductModel,
} from '../../models/product/product.model.mongo';
import { Variant } from '../../types/product/variant/variant';
import { preOrderImportRepository } from '../../repositories/pre-order-import/pre-order-import.repository';
import { compareDate } from '../../utils/date.util';
import { PreOrderImportStatus } from '../../config/enums/pre-order-import.enum';
import { embeddingModel } from '../../config/google-gemini-ai.config';

type QueryRewriteResponse = {
    choices?: Array<{
        message?: {
            role?: string;
            content?: string | Array<{ type?: string; text?: string }>;
        };
    }>;
};

type SuitabilityDecision = {
    id: string;
    matchedVariantSku?: string;
    inStock?: boolean;
    score?: number;
    reason?: string;
};

const QUERY_REWRITE_API_BASE_URL =
    process.env.AISHOP24H_BASE_URL ?? 'https://aishop24h.com/v1';
const QUERY_REWRITE_MODEL =
    process.env.AISHOP24H_MODEL ?? 'google/gemini-2.0-flash-lite';
const QUERY_REWRITE_API_KEY = process.env.AISHOP24H_API_KEY;
const QUERY_REWRITE_MAX_RETRIES = 2;

const VECTOR_SEARCH_NUM_CANDIDATES = 60;
const VECTOR_SEARCH_LIMIT = 12;
const FINAL_PRODUCTS_LIMIT = 4;
const MIN_VECTOR_SCORE = 0.62;
const MIN_VECTOR_SCORE_FALLBACK = 0.45;
const MIN_VECTOR_SCORE_HARD_FLOOR = 0.3;

async function callAishopTextCompletion(
    prompt: string,
    systemPrompt: string,
    temperature = 0.2
): Promise<string> {
    if (!QUERY_REWRITE_API_KEY) {
        return '';
    }

    const response = await fetch(
        `${QUERY_REWRITE_API_BASE_URL.replace(/\/$/, '')}/chat/completions`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${QUERY_REWRITE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: QUERY_REWRITE_MODEL,
                temperature,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
            }),
        }
    );

    if (!response.ok) {
        return '';
    }

    const payload = (await response.json()) as QueryRewriteResponse;
    const assistantChoice = payload.choices?.find(
        item => item.message?.role === 'assistant'
    );

    const content =
        assistantChoice?.message?.content ??
        payload.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
        return content.trim();
    }
    if (Array.isArray(content)) {
        return content
            .map(part => part.text ?? '')
            .join(' ')
            .trim();
    }
    return '';
}

class ProductService {
    /**
     * Hàm giúp chuyển mảng product gửi lên thành định dạng gia công
     * @param {ProductConfigManufacturing} payload - the payload contains the products and parameters
     * @returns {Promise<OrderProductClientCreate>} - the promise will return an OrderProductClientCreate object
     * @throws {ConflictRequestError} - if the products sent in the payload is not valid
     * @throws {NotFoundRequestError} - if the product is not found in the database
     */
    // async configProductManufacturing(
    //     payload: ProductConfigManufacturing
    // ): Promise<OrderProductClientCreate> {
    //     if (payload.products.length > 2) {
    //         throw new ConflictRequestError('Vui lòng chọn tối đa 2 mặt hàng!');
    //     }
    //     const productFinal: OrderProductClientCreate = {
    //         quantity: 1,
    //     };
    //     const items = [];
    //     for (const product of payload.products) {
    //         const item = await productRepository.findOne({
    //             _id: product.id,
    //             'variants.sku': product.sku,
    //         });
    //         if (!item) {
    //             throw new NotFoundRequestError('Mặt hàng không tồn tại!');
    //         }
    //         items.push(item);
    //     }

    //     if (items.length == 1) {
    //         // nếu chỉ có 1 sp thì phải là lens
    //         if (items[0].type != ProductType.LENS) {
    //             throw new ConflictRequestError('Vui lòng chọn thêmn tròng!');
    //         }
    //         productFinal.lens = {
    //             lens_id: payload.products[0].id,
    //             parameters: payload.parameters,
    //             sku: payload.products[0].sku,
    //         };
    //     } else {
    //         // nêu gửi lên 2 sp thì phải là gọng và tròng
    //         if (
    //             items[0].type == ProductType.LENS &&
    //             items[1].type != ProductType.LENS
    //         ) {
    //             productFinal.lens = {
    //                 lens_id: payload.products[0].id,
    //                 parameters: payload.parameters,
    //                 sku: payload.products[0].sku,
    //             };
    //             productFinal.product = {
    //                 product_id: payload.products[1].id,
    //                 sku: payload.products[1].sku,
    //             };
    //         } else if (
    //             items[0].type != ProductType.LENS &&
    //             items[1].type == ProductType.LENS
    //         ) {
    //             productFinal.lens = {
    //                 lens_id: payload.products[1].id,
    //                 parameters: payload.parameters,
    //                 sku: payload.products[1].sku,
    //             };
    //             productFinal.product = {
    //                 product_id: payload.products[0].id,
    //                 sku: payload.products[0].sku,
    //             };
    //         } else {
    //             throw new ConflictRequestError(
    //                 'Vui lòng chọn thêm gọng hoặc tròng!'
    //             );
    //         }
    //     }
    //     return productFinal;
    // }
    /**
     * Helper: Hàm giúp kiểm kiểm tra chắn chắn tuyệt đối là sản phẩm người dùng muốn mua (cả thg và gia công) có đủ khả năng mua ngay
     * @param product
     * @param lens
     */
    ensureBoughtProductIsValidToBuy = async (
        product: {
            productId: string;
            productSku: string;
            buyAmount: number;
        },
        lens?: {
            lensId: string;
            lensSku: string;
            buyAmount: number;
        }
    ): Promise<{
        product: {
            productDetail: IProductDocument;
            productVariant: Variant;
        };
        lens?: {
            lensDetail: IProductDocument;
            lensVariant: Variant;
        };
    }> => {
        const productDetail = await productRepository.findOne({
            _id: product.productId,
            'variants.sku': product.productSku,
        });
        if (!productDetail) {
            throw new NotFoundRequestError('Product not found');
        }
        const productVariant = productDetail.variants.find(
            v => v.sku === product.productSku
        );
        if (!productVariant) {
            throw new NotFoundRequestError('Variant not found');
        }
        const keyRace = `${redisPrefix.productLockRace}:${product.productId}:${product.productSku}`;
        const keyOnline = `${redisPrefix.productLockOnline}:${product.productId}:${product.productSku}`;
        const stockRace =
            (await redisService.getDataByKey<number>(keyRace)) || 0;
        const stockOnline =
            (await redisService.getDataByKey<number>(keyOnline)) || 0;
        let currentProductInStock = 0;
        if (productVariant.mode === ProductVariantMode.PRE_ORDER) {
            // nếu đây là sp pre-order thì cần check bên bên bảng pre-order-import
            const foundPreOrderImport = await preOrderImportRepository.findOne({
                sku: productVariant.sku,
                status: PreOrderImportStatus.PENDING,
            });
            if (!foundPreOrderImport) {
                throw new BadRequestError(
                    `Product with sku ${productVariant.sku} does not have pre-order plan`
                );
            }
            const isValidStart =
                compareDate(new Date(), foundPreOrderImport.startedDate) >= 0;
            const isValidEnd =
                compareDate(new Date(), foundPreOrderImport.endedDate) <= 0;
            if (!isValidStart || !isValidEnd) {
                // nếu ngày hiện tại bé hơn thời gian sk diễn ra hoặc lớn hơn thời gian sk kết thúc thì báo lỗi
                throw new BadRequestError(
                    `Product with sku ${productVariant.sku} can not order right now due to invalid pre-order date plan!`
                );
            }
            currentProductInStock =
                foundPreOrderImport.targetQuantity -
                (stockRace + stockOnline) -
                product.buyAmount -
                foundPreOrderImport.preOrderedQuantity;
        } else {
            currentProductInStock =
                productVariant.stock -
                (stockRace + stockOnline) -
                product.buyAmount;
        }

        if (currentProductInStock < 0) {
            throw new BadRequestError('Product is not enough in stock');
        }
        const dataFinal: {
            product: {
                productDetail: IProductDocument;
                productVariant: Variant;
            };
            lens?: {
                lensDetail: IProductDocument;
                lensVariant: Variant;
            };
        } = {
            product: {
                productDetail: productDetail,
                productVariant: productVariant,
            },
        };
        if (lens) {
            const lensDetail = await productRepository.findOne({
                _id: lens.lensId,
                type: 'lens',
            });
            if (!lensDetail) {
                throw new BadRequestError(
                    'Not support manufacture with lens or sunglass'
                );
            }
            const lensVariant = lensDetail.variants.find(
                v => v.sku === lens.lensSku
            );
            if (!lensVariant) {
                throw new NotFoundRequestError('Variant not found');
            }
            if (productDetail.type !== ProductType.FRAME) {
                throw new BadRequestError(
                    'Not support manufacture with lens or sunglass'
                );
            }
            const keyRace = `${redisPrefix.productLockRace}:${lens.lensId}:${lens.lensSku}`;
            const keyOnline = `${redisPrefix.productLockOnline}:${lens.lensId}:${lens.lensSku}`;
            const stockRace =
                (await redisService.getDataByKey<number>(keyRace)) || 0;
            const stockOnline =
                (await redisService.getDataByKey<number>(keyOnline)) || 0;
            let currentLensInStock = 0;
            if (lensVariant.mode === ProductVariantMode.PRE_ORDER) {
                // nếu đây là sp pre-order thì cần check bên bên bảng pre-order-import
                const foundLensPreOrderImport =
                    await preOrderImportRepository.findOne({
                        sku: lensVariant.sku,
                        status: PreOrderImportStatus.PENDING,
                    });
                if (!foundLensPreOrderImport) {
                    throw new BadRequestError(
                        `Lens with sku ${lensVariant.sku} does not have pre-order plan`
                    );
                }
                const isValidStart =
                    compareDate(
                        new Date(),
                        foundLensPreOrderImport.startedDate
                    ) >= 0;
                const isValidEnd =
                    compareDate(
                        new Date(),
                        foundLensPreOrderImport.endedDate
                    ) <= 0;
                if (!isValidStart || !isValidEnd) {
                    // nếu ngày hiện tại bé hơn thời gian sk diễn ra hoặc lớn hơn thời gian sk kết thúc thì báo lỗi
                    throw new BadRequestError(
                        `Lens with sku ${lensVariant.sku} can not order right now due to invalid pre-order date plan!`
                    );
                }
                currentLensInStock =
                    foundLensPreOrderImport.targetQuantity -
                    (stockRace + stockOnline) -
                    product.buyAmount -
                    foundLensPreOrderImport.preOrderedQuantity;
            } else {
                currentLensInStock =
                    lensVariant.stock -
                    (stockRace + stockOnline) -
                    product.buyAmount;
            }

            if (currentLensInStock < 0) {
                throw new BadRequestError('Lens is not enough in stock');
            }
            dataFinal.lens = {
                lensDetail: lensDetail,
                lensVariant: lensVariant,
            };
        }
        return dataFinal;
    };

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length || a.length === 0) return -1;

        let dot = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator === 0) return -1;

        return dot / denominator;
    }

    private async embedQueryText(text: string): Promise<number[]> {
        const result = await embeddingModel.embedContent(text);
        const values = (result as any)?.embedding?.values;

        if (!Array.isArray(values) || values.length === 0) {
            throw new Error('Embedding result is empty or invalid');
        }

        return values as number[];
    }

    private isQueryRewriteRetryable(error: unknown): boolean {
        const status = (error as { status?: number })?.status;
        return status === 429 || status === 502 || status === 503;
    }

    private async rewriteQueryWithAishop(
        queryText: string,
        messageHistory: any[]
    ): Promise<string> {
        if (!QUERY_REWRITE_API_KEY) {
            return queryText;
        }

        const historyText = messageHistory
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');

        const prompt = [
            'Bạn là hệ thống chuẩn hóa truy vấn tìm kiếm sản phẩm kính mắt.',
            'Nhiệm vụ: viết lại truy vấn người dùng thành 1 câu ngắn gọn để semantic search hiệu quả hơn.',
            'Yêu cầu bắt buộc:',
            '- Không đổi ý định gốc của người dùng.',
            '- Giữ đầy đủ ràng buộc nếu có: loại sản phẩm (gọng/kính mát/tròng), ngân sách, giới tính, màu, dáng, thương hiệu, nhu cầu chức năng.',
            '- Nếu người dùng hỏi mơ hồ, làm rõ thành truy vấn mua hàng hợp lý nhưng không bịa thông tin cụ thể.',
            '- Nếu có yêu cầu về tròng kính thì giữ lại thông tin spec/feature/material (ví dụ chống ánh sáng xanh, đổi màu, polycarbonate...).',
            '- Trả về duy nhất 1 câu plain text để đem đi embed.',
            '',
            `Truy vấn hiện tại: ${queryText}`,
            'Hội thoại gần nhất:',
            historyText,
        ].join('\n');

        let lastError: unknown;

        for (let attempt = 1; attempt <= QUERY_REWRITE_MAX_RETRIES; attempt++) {
            try {
                const rewritten = await callAishopTextCompletion(
                    prompt,
                    'Bạn tối ưu truy vấn retrieval cho sản phẩm kính mắt.',
                    0.2
                );

                if (rewritten) {
                    return rewritten;
                }

                throw new Error('Aishop rewrite returned empty content');
            } catch (error) {
                lastError = error;
                if (
                    !this.isQueryRewriteRetryable(error) ||
                    attempt === QUERY_REWRITE_MAX_RETRIES
                ) {
                    console.warn(
                        '[WARN] Query rewrite failed. Fallback to original query.'
                    );
                    return queryText;
                }
            }
        }

        if (lastError) {
            console.warn('[WARN] Query rewrite exhausted retries:', lastError);
        }
        return queryText;
    }

    private async generateQueryFromHistory(
        messageHistory: any[]
    ): Promise<string> {
        const conversationText = messageHistory
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');

        const prompt = `Based on the following conversation between a customer and an AI eyewear sales assistant, extract and summarize the customer's current product requirements in a concise format.

Conversation:
${conversationText}

Please provide a brief summary (1-2 sentences) that captures:
- Product type (frame/sunglass/lens)
- Gender preference (male/female/unisex)
- Price range
- Color preference
- Shape preference
- Style preference
- Brand preference
- Special features
- Lens feature/material requirements when mentioned

Only include information that was explicitly mentioned or clearly implied. If something wasn't discussed, don't include it.

Summary:`;

        const rewritten = await callAishopTextCompletion(
            prompt,
            'You extract concise shopping requirements for eyewear search.',
            0.2
        );

        return rewritten || conversationText.slice(-300);
    }

    private async rankProductsBySuitabilityWithAI(
        userQuery: string,
        products: any[]
    ): Promise<any[]> {
        if (!products.length) {
            return products;
        }

        const prompt = `Bạn là chuyên gia tư vấn kính mắt. Dựa trên yêu cầu người dùng và dữ liệu JSON sản phẩm, hãy đánh giá mức độ phù hợp của từng sản phẩm.

Yêu cầu người dùng:
${userQuery}

Danh sách sản phẩm JSON:
${JSON.stringify(products, null, 2)}

Quy tắc:
- Chỉ đánh giá dựa trên dữ liệu có trong JSON.
- Không bịa thêm thông tin.
- BẮT BUỘC kiểm tra tồn kho theo variant. Nếu variant phù hợp nhất có stock > 0 và mode AVAILABLE thì inStock=true.
- Nếu không có variant nào phù hợp và còn hàng thì inStock=false.
- Nếu thiếu dữ liệu để kết luận mạnh, vẫn chấm điểm thận trọng và ghi lý do thiếu dữ liệu.
- Trả về DUY NHẤT JSON array theo format:
[
  {"id":"productId","matchedVariantSku":"SKU nếu có","inStock":true|false,"score":0-100,"reason":"..."}
]
- Sắp xếp theo score giảm dần.`;

        try {
            let text = '';

            if (QUERY_REWRITE_API_KEY) {
                const response = await fetch(
                    `${QUERY_REWRITE_API_BASE_URL.replace(
                        /\/$/,
                        ''
                    )}/chat/completions`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${QUERY_REWRITE_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: QUERY_REWRITE_MODEL,
                            temperature: 0.2,
                            messages: [
                                {
                                    role: 'system',
                                    content:
                                        'Bạn chấm độ phù hợp sản phẩm và xác nhận tồn kho theo dữ liệu variant.',
                                },
                                {
                                    role: 'user',
                                    content: prompt,
                                },
                            ],
                        }),
                    }
                );

                if (response.ok) {
                    const payload =
                        (await response.json()) as QueryRewriteResponse;
                    const assistantChoice = payload.choices?.find(
                        item => item.message?.role === 'assistant'
                    );
                    const content =
                        assistantChoice?.message?.content ??
                        payload.choices?.[0]?.message?.content;

                    if (typeof content === 'string') {
                        text = content.trim();
                    } else if (Array.isArray(content)) {
                        text = content
                            .map(part => part.text ?? '')
                            .join(' ')
                            .trim();
                    }
                }
            }

            if (!text) {
                return products;
            }

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            const parsed = jsonMatch
                ? (JSON.parse(jsonMatch[0]) as SuitabilityDecision[])
                : [];

            if (!Array.isArray(parsed) || parsed.length === 0) {
                return products;
            }

            const scoreMap = new Map<string, number>();
            const stockMap = new Map<string, boolean>();

            for (const item of parsed) {
                if (!item?.id) continue;
                scoreMap.set(
                    String(item.id),
                    Number.isFinite(item.score) ? Number(item.score) : 0
                );
                stockMap.set(String(item.id), Boolean(item.inStock));
            }

            return [...products].sort((a: any, b: any) => {
                const stockA = stockMap.get(String(a._id)) ? 1 : 0;
                const stockB = stockMap.get(String(b._id)) ? 1 : 0;
                if (stockA !== stockB) {
                    return stockB - stockA;
                }
                const scoreA = scoreMap.get(String(a._id)) ?? 0;
                const scoreB = scoreMap.get(String(b._id)) ?? 0;
                return scoreB - scoreA;
            });
        } catch (error) {
            console.warn(
                '[WARN] AI suitability ranking failed, fallback vector order.',
                error
            );
            return products;
        }
    }

    /**
     * Get the stock of a variant directly from MongoDB
     * @param productId - The product ID
     * @param sku - The variant SKU
     * @returns The stock quantity from the database
     * @throws {NotFoundRequestError} - if product or variant not found
     * @throws {BadRequestError} - if pre-order product has invalid configuration
     */
    getVariantStock = async (
        productId: string,
        sku: string
    ): Promise<number> => {
        // Find the product with the specified variant
        const product = await productRepository.findOne({
            _id: productId,
            'variants.sku': sku,
        });

        if (!product) {
            throw new NotFoundRequestError('Product not found');
        }

        // Find the specific variant
        const variant = product.variants.find(v => v.sku === sku);
        if (!variant) {
            throw new NotFoundRequestError('Variant not found');
        }

        if (variant.mode === ProductVariantMode.PRE_ORDER) {
            // For pre-order products, get stock from pre-order-import table
            const preOrderImport = await preOrderImportRepository.findOne({
                sku: variant.sku,
                status: PreOrderImportStatus.PENDING,
            });

            if (!preOrderImport) {
                return 0;
            }

            // Return available quantity from pre-order import
            return (
                preOrderImport.targetQuantity -
                preOrderImport.preOrderedQuantity
            );
        } else {
            // For regular products, return stock from variant
            return variant.stock;
        }
    };

    buildQueryForAISuggestion = async (
        messageHistory?: any[],
        latestUserMessage?: string
    ) => {
        let queryText = '';

        if (latestUserMessage && latestUserMessage.trim()) {
            queryText = latestUserMessage.trim();
        } else if (messageHistory && messageHistory.length > 0) {
            queryText = await this.generateQueryFromHistory(messageHistory);
        } else {
            throw new Error('Message history is required for AI suggestions');
        }

        const optimizedQueryText = await this.rewriteQueryWithAishop(
            queryText,
            messageHistory ?? []
        );

        const vectorQueryText =
            queryText.trim().length >= 3 ? queryText : optimizedQueryText;
        const queryEmbedding = await this.embedQueryText(vectorQueryText);

        const runVectorSearch = async (filter: Record<string, unknown>) =>
            ProductModel.aggregate([
                {
                    $vectorSearch: {
                        index: 'vector_index_embedding',
                        path: 'embedding',
                        queryVector: queryEmbedding,
                        numCandidates: VECTOR_SEARCH_NUM_CANDIDATES,
                        limit: VECTOR_SEARCH_LIMIT,
                        filter,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        vectorScore: { $meta: 'vectorSearchScore' },
                    },
                },
            ]);

        let candidates: any[] = await runVectorSearch({ deletedAt: null });

        if (candidates.length) {
            const topScoresPreview = candidates
                .slice(0, 5)
                .map((item: any) =>
                    typeof item.vectorScore === 'number'
                        ? Number(item.vectorScore.toFixed(4))
                        : null
                );
            console.log('[RAG] vectorQueryText:', vectorQueryText);
            console.log('[RAG] top vector scores:', topScoresPreview);
        }

        let products;
        if (candidates.length > 0) {
            const filteredCandidates = candidates.filter(
                (item: any) =>
                    typeof item.vectorScore === 'number' &&
                    item.vectorScore >= MIN_VECTOR_SCORE
            );

            let selectedCandidates = filteredCandidates;

            if (selectedCandidates.length === 0) {
                const topScore =
                    typeof candidates[0]?.vectorScore === 'number'
                        ? candidates[0].vectorScore
                        : 0;

                // Adaptive fallback: nếu score cao nhất vẫn đủ tín hiệu semantic,
                // nhận các item >= ngưỡng mềm để tránh rỗng hoàn toàn.
                if (topScore >= MIN_VECTOR_SCORE_FALLBACK) {
                    selectedCandidates = candidates.filter(
                        (item: any) =>
                            typeof item.vectorScore === 'number' &&
                            item.vectorScore >= MIN_VECTOR_SCORE_FALLBACK
                    );
                }

                // Fallback cuối: vẫn trả top-k nếu score không quá thấp,
                // tránh trường hợp người dùng luôn nhận products rỗng.
                if (
                    !selectedCandidates.length &&
                    topScore >= MIN_VECTOR_SCORE_HARD_FLOOR
                ) {
                    selectedCandidates = candidates.slice(
                        0,
                        FINAL_PRODUCTS_LIMIT
                    );
                }
            }

            if (selectedCandidates.length === 0) {
                return {
                    paraphrasedIntent: optimizedQueryText,
                    products: [],
                };
            }

            const ids = selectedCandidates.map((item: any) => item._id);
            const fullProducts = await ProductModel.find({
                _id: { $in: ids },
                deletedAt: null,
            }).lean();

            const productMap = new Map<string, any>(
                fullProducts.map((item: any) => [String(item._id), item])
            );
            const orderedByVector = ids
                .map((id: any) => productMap.get(String(id)))
                .filter(Boolean) as any[];

            const normalizedQuery = `${queryText} ${optimizedQueryText}`
                .toLowerCase()
                .trim();

            const colorAliases: Record<string, string[]> = {
                black: ['black', 'đen', '#000000'],
                white: ['white', 'trắng', '#ffffff'],
                blue: ['blue', 'xanh', '#0000ff'],
                red: ['red', 'đỏ', '#ff0000'],
                brown: ['brown', 'nâu', '#8b4513', '#a52a2a'],
                pink: ['pink', 'hồng', '#ffc0cb'],
                gold: ['gold', 'vàng', '#d4af37'],
                silver: ['silver', 'bạc', '#c0c0c0'],
                grey: ['grey', 'gray', 'xám', '#808080'],
            };

            const productTypeHints: Array<{
                key: string;
                values: ProductType[];
            }> = [
                { key: 'frame', values: [ProductType.FRAME] },
                { key: 'gọng', values: [ProductType.FRAME] },
                { key: 'sunglass', values: [ProductType.SUNGLASS] },
                { key: 'kính mát', values: [ProductType.SUNGLASS] },
                { key: 'lens', values: [ProductType.LENS] },
                { key: 'tròng', values: [ProductType.LENS] },
            ];

            const detectedTypeSet = new Set<ProductType>();
            for (const hint of productTypeHints) {
                if (normalizedQuery.includes(hint.key)) {
                    hint.values.forEach(v => detectedTypeSet.add(v));
                }
            }

            const detectedColorAlias = Object.values(colorAliases).find(
                aliasGroup =>
                    aliasGroup.some(alias => normalizedQuery.includes(alias))
            );

            const filteredByIntent = orderedByVector.filter((product: any) => {
                const byType =
                    detectedTypeSet.size === 0 ||
                    detectedTypeSet.has(product.type as ProductType);

                if (!byType) return false;

                if (!detectedColorAlias) return true;

                const variants = Array.isArray(product.variants)
                    ? product.variants
                    : [];

                return variants.some((variant: any) => {
                    const options = Array.isArray(variant?.options)
                        ? variant.options
                        : [];

                    return options.some((option: any) => {
                        const optionText = `${option?.attributeName ?? ''} ${
                            option?.label ?? ''
                        } ${option?.value ?? ''}`.toLowerCase();
                        return detectedColorAlias.some(alias =>
                            optionText.includes(alias)
                        );
                    });
                });
            });

            let candidatesAfterIntentFilter =
                filteredByIntent.length > 0
                    ? filteredByIntent
                    : detectedTypeSet.size > 0
                    ? []
                    : orderedByVector;

            if (
                !candidatesAfterIntentFilter.length &&
                detectedTypeSet.size > 0
            ) {
                const typeValues = Array.from(detectedTypeSet);
                const typeAndColorFilter: any = {
                    deletedAt: null,
                    type: { $in: typeValues },
                };

                if (detectedColorAlias) {
                    typeAndColorFilter.$or = [
                        {
                            nameBase: {
                                $regex: detectedColorAlias.join('|'),
                                $options: 'i',
                            },
                        },
                        {
                            'variants.name': {
                                $regex: detectedColorAlias.join('|'),
                                $options: 'i',
                            },
                        },
                        {
                            'variants.options.label': {
                                $regex: detectedColorAlias.join('|'),
                                $options: 'i',
                            },
                        },
                        {
                            'variants.options.value': {
                                $regex: detectedColorAlias.join('|'),
                                $options: 'i',
                            },
                        },
                    ];
                }

                const strictTypeProducts = await ProductModel.find(
                    typeAndColorFilter
                )
                    .limit(VECTOR_SEARCH_LIMIT)
                    .lean();

                candidatesAfterIntentFilter = strictTypeProducts;
            }

            const shouldRunAIRank =
                candidatesAfterIntentFilter.length > FINAL_PRODUCTS_LIMIT &&
                Boolean(QUERY_REWRITE_API_KEY);

            products = shouldRunAIRank
                ? await this.rankProductsBySuitabilityWithAI(
                      optimizedQueryText,
                      candidatesAfterIntentFilter
                  )
                : candidatesAfterIntentFilter;

            products = products.slice(0, FINAL_PRODUCTS_LIMIT);
        } else {
            const normalized = queryText.toLowerCase();
            const colorHints = [
                'đen',
                'black',
                'trắng',
                'white',
                'nâu',
                'brown',
                'xanh',
                'blue',
                'đỏ',
                'red',
                'hồng',
                'pink',
                'vàng',
                'gold',
                'bạc',
                'silver',
            ];

            const matchedColor = colorHints.find(color =>
                normalized.includes(color)
            );

            if (!matchedColor) {
                return {
                    paraphrasedIntent: optimizedQueryText,
                    products: [],
                };
            }

            const keywordProducts = await ProductModel.find({
                deletedAt: null,
                $or: [
                    { nameBase: { $regex: matchedColor, $options: 'i' } },
                    {
                        'variants.name': {
                            $regex: matchedColor,
                            $options: 'i',
                        },
                    },
                    {
                        'variants.options.label': {
                            $regex: matchedColor,
                            $options: 'i',
                        },
                    },
                    {
                        'variants.options.value': {
                            $regex: matchedColor,
                            $options: 'i',
                        },
                    },
                ],
            })
                .limit(FINAL_PRODUCTS_LIMIT)
                .lean();

            return {
                paraphrasedIntent: optimizedQueryText,
                products: keywordProducts,
            };
        }

        return {
            paraphrasedIntent: optimizedQueryText,
            products,
        };
    };
}
export default new ProductService();
