import { FilterQuery } from 'mongoose';
import { redisPrefix } from '../../config/constants/redis.constant';
import { CheckoutSource } from '../../config/enums/checkout.enum';
import { ProductType } from '../../config/enums/prodcuts.enum';
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
import { IProductDocument } from '../../models/product/product.model.mongo';
import { Variant } from '../../types/product/variant/variant';

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
        const currentProductInStock =
            productVariant.stock -
            (stockRace + stockOnline) -
            product.buyAmount;

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

            const currentLensInStock =
                lensVariant.stock -
                (stockRace + stockOnline) -
                product.buyAmount;
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
}
export default new ProductService();
