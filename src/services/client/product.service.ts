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
    //         throw new ConflictRequestError('Please select a maximum of 2 items!');
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
    //             throw new NotFoundRequestError('Item does not exist!');
    //         }
    //         items.push(item);
    //     }

    //     if (items.length == 1) {
    //         // nếu chỉ có 1 sp thì phải là lens
    //         if (items[0].type != ProductType.LENS) {
    //             throw new ConflictRequestError('Please select a lens!');
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
    //                 'Please select an additional frame or lens!'
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
        // console.log(values);
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
            'You are a normalization system for eyewear product search queries.',
            'Task: rewrite the user query into a concise sentence for more effective semantic search.',
            'Mandatory requirements:',
            '- Do not change the user\'s original intent.',
            '- Keep all constraints if present: product type (frame/sunglass/lens), budget, gender, color, shape, brand, functional needs.',
            '- If the user\'s query is vague, clarify it into a reasonable purchase query without inventing specific information.',
            '- If there are lens requirements, retain spec/feature/material information (e.g., blue light blocking, photochromic, polycarbonate...).',
            '- Return only a single plain text sentence for embedding.',
            '',
            `Current query: ${queryText}`,
            'Recent conversation:',
            historyText,
        ].join('\n');

        let lastError: unknown;

        for (let attempt = 1; attempt <= QUERY_REWRITE_MAX_RETRIES; attempt++) {
            try {
                const rewritten = await callAishopTextCompletion(
                    prompt,
                    'You optimize retrieval queries for eyewear products.',
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

        const prompt = `You are an eyewear consultant. Based on user requirements and product JSON data, evaluate the suitability of each product.

User requirements:
${userQuery}

Product JSON list:
${JSON.stringify(products, null, 2)}

Rules:
- Evaluate only based on the data provided in the JSON.
- Do not invent information.
- MANDATORY: check inventory by variant. If the most suitable variant has stock > 0 and mode AVAILABLE, then inStock=true.
- If no suitable variant is in stock, then inStock=false.
- If data is insufficient for a strong conclusion, still score cautiously and note the reason for the data gap.
- Return ONLY a JSON array in the following format:
[
  {"id":"productId","matchedVariantSku":"SKU if available","inStock":true|false,"score":0-100,"reason":"..."}
]
- Sort by score in descending order.`;

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
                                        'You evaluate product suitability and confirm inventory based on variant data.',
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

    buildQueryForAISuggestion = async (messageHistory: any[]) => {
        let queryText = '';

        // if (messageHistory && messageHistory.length > 0) {
        //     queryText = await this.generateQueryFromHistory(messageHistory);
        // } else {
        //     throw new Error('Message history is required for AI suggestions');
        // }

        const optimizedQueryText = messageHistory[messageHistory.length - 1].content;
        console.log(optimizedQueryText);
        // await this.rewriteQueryWithAishop(
        //     queryText,
        //     messageHistory
        // );

        const queryEmbedding = await this.embedQueryText(optimizedQueryText);
        const candidates = await ProductModel.aggregate([
            {
                $vectorSearch: {
                    index: 'vector_index_embedding',
                    path: 'embedding',
                    queryVector: queryEmbedding,
                    numCandidates: 100,
                    limit: 5,
                },
            },
            {
                $project: {
                    _id: 1,
                },
            },
        ]);

        let products;
        if (candidates.length > 0) {
            console.log("found candidate");
            const ids = candidates.map((item: any) => item._id);
            const fullProducts = await ProductModel.find({
                _id: { $in: ids },
                deletedAt: null,
            }).lean();

            // const productMap = new Map<string, any>(
            //     fullProducts.map((item: any) => [String(item._id), item])
            // );
            // const orderedByVector = ids
            //     .map((id: any) => productMap.get(String(id)))
            //     .filter(Boolean) as any[];

            // products = await this.rankProductsBySuitabilityWithAI(
            //     optimizedQueryText,
            //     orderedByVector
            // );

            products = fullProducts.slice(0, 4);
        } else {
            console.log(">>> not found candidate");
            products = await ProductModel.find({
                deletedAt: null,
                embedding: { $exists: true, $ne: null },
            })
                .limit(8)
                .lean();

            // products = await this.rankProductsBySuitabilityWithAI(
            //     optimizedQueryText,
            //     products
            // );

            products = products.slice(0, 4);
        }

        return {
            paraphrasedIntent: optimizedQueryText,
            products,
        };
    };
}
export default new ProductService();