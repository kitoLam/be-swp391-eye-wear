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

    private buildMongoFilterFromIntent(intent: any) {
        const query: any = {
            deletedAt: null,
            embedding: { $exists: true, $ne: null },
        };

        if (intent?.type) {
            query.type = intent.type;
            if (intent.type == 'lens') {
                if (intent.feature) {
                    query['spec.feature'] = {
                        $regex: intent.feature,
                        $options: 'i',
                    };
                }
            } else {
                if (intent.gender) {
                    query['spec.gender'] = { $regex: intent.gender, $options: 'i' };
                }
                if (intent?.shape) {
                    query['spec.shape'] = {
                        $regex: intent.shape,
                        $options: 'i',
                    };
                }
                if (intent?.style) {
                    query['spec.style'] = {
                        $regex: intent.style,
                        $options: 'i',
                    };
                }
            }
        }
        if (intent.brand) {
            query.brand = { $regex: intent.brand, $options: 'i' };
        }
        if (intent?.priceLower || intent?.priceUpper) {
            query['variants.finalPrice'] = {};
            if (intent.priceLower)
                query['variants.finalPrice'].$gte = intent.priceLower;
            if (intent.priceUpper)
                query['variants.finalPrice'].$lte = intent.priceUpper;
        }
        if (intent?.color) {
            query.variants = {
                $elemMatch: {
                    options: {
                        $elemMatch: {
                            label: { $regex: intent.color, $options: 'i' },
                        },
                    },
                },
            };
        }

        return query;
    }

    buildQueryForAISuggestion = async (intent: any, userMessage?: string) => {
        const query = this.buildMongoFilterFromIntent(intent);

        const queryText = [
            userMessage ?? '',
            `type=${intent?.type ?? ''}`,
            `gender=${intent?.gender ?? ''}`,
            `color=${intent?.color ?? ''}`,
            `shape=${intent?.shape ?? ''}`,
            `priceLower=${intent?.priceLower ?? ''}`,
            `priceUpper=${intent?.priceUpper ?? ''}`,
            `style=${intent?.style ?? ''}`,
            `brand=${intent?.brand ?? ''}`,
            `feature=${intent?.feature ?? ''}`,
        ]
            .filter(Boolean)
            .join(' | ');

        const queryEmbedding = await this.embedQueryText(queryText);
        const candidates = await ProductModel.find(query).limit(80);
        const ranked = candidates
            .map(item => {
                const embedding = Array.isArray((item as any).embedding)
                    ? ((item as any).embedding as number[])
                    : [];

                return {
                    item,
                    score: this.cosineSimilarity(queryEmbedding, embedding),
                };
            })
            .filter(x => x.score > -1)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
            .map(x => x.item);
        if (ranked.length > 0) {
            return ranked;
        }
        
        return ProductModel.find({
            ...query,
            embedding: { $exists: false },
        }).limit(4);
    };
}
export default new ProductService();
