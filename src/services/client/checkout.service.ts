import { redisPrefix } from '../../config/constants/redis.constant';
import { CheckoutSource } from '../../config/enums/checkout.enum';
import {
    BadRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { productRepository } from '../../repositories/product/product.repository';
import { CheckoutSessionCreate } from '../../types/checkout/checkout.request';
import { AuthCustomerContext } from '../../types/context/context';
import { OrderProductClientCreate } from '../../types/order/order-product';
import * as generateUtil from '../../utils/generate.util';
import redisService from '../redis.service';
import productService from './product.service';
class CheckoutService {
    /**
     * Tạo một checkout session mới
     * @param {AuthCustomerContext} customer - customer object
     * @param {CheckoutSessionCreate} payload - checkout session payload
     * @returns {Promise<string>} - checkout session id
     * @throws {NotFoundRequestError} - if checkout product not found
     */
    createCheckoutSession = async (
        customer: AuthCustomerContext,
        payload: CheckoutSessionCreate
    ): Promise<string> => {
        const checkoutTimeout = 15 * 60; // 15p
        const checkoutSessionId = generateUtil.generateSessionId();
        for (const item of payload.products) {
            await productService.ensureBoughtProductIsValidToBuy(
                {
                    productId: item.product.product_id,
                    productSku: item.product.sku,
                    buyAmount: item.quantity,
                },
                item.lens
                    ? {
                          lensId: item.lens.lens_id,
                          lensSku: item.lens.sku,
                          buyAmount: item.quantity,
                      }
                    : undefined
            );
        }
        await redisService.setDataWithExpiredTime(
            `${redisPrefix.checkoutSession}:${checkoutSessionId}:${customer.id}`,
            payload,
            checkoutTimeout
        );
        return checkoutSessionId;
    };
    /**
     * Lấy danh sách sản phẩm trong checkout session
     * @param {AuthCustomerContext} customer - customer object
     * @param {string} checkoutSessionId - checkout session id
     * @returns {Promise<OrderProductClientCreate[]>} - list of products in checkout session
     * @throws {NotFoundRequestError} - if checkout session not found
     */

    getProductListFromCheckout = async (
        customer: AuthCustomerContext,
        checkoutSessionId: string
    ) => {
        const checkoutSessionDetail =
            await redisService.getDataByKey<CheckoutSessionCreate>(
                `${redisPrefix.checkoutSession}:${checkoutSessionId}:${customer.id}`
            );
        if (!checkoutSessionDetail) {
            throw new NotFoundRequestError('Checkout session not found');
        }
        const productListFinal = [];
        for (const item of checkoutSessionDetail.products) {
            const product: any = {};
            if (item.lens) {
                const lensDetail = await productRepository.findOne({
                    _id: item.lens.lens_id,
                });
                if (!lensDetail) {
                    throw new NotFoundRequestError('Lens not found');
                }
                const variant = lensDetail.variants.find(
                    v => v.sku === item.lens?.sku
                );
                if (!variant) {
                    throw new NotFoundRequestError('Variant not found');
                }
                product['lens'] = {
                    ...item.lens,
                    options: variant.options
                        .map(item => `${item.attributeName}: ${item.label}`)
                        .join(', '),
                    img: variant.imgs[0] || '',
                    price: variant.price,
                    finalPrice: variant.finalPrice,
                    name: variant.name,
                };
            }
            const productDetail = await productRepository.findOne({
                _id: item.product.product_id,
            });
            if (!productDetail) {
                throw new NotFoundRequestError('Product not found');
            }
            const variant = productDetail.variants.find(
                v => v.sku === item.product?.sku
            );
            if (!variant) {
                throw new NotFoundRequestError('Variant not found');
            }
            product['product'] = {
                ...item.product,
                options: variant.options
                    .map(item => `${item.attributeName}: ${item.label}`)
                    .join(', '),
                img: variant.imgs[0] || '',
                price: variant.price,
                finalPrice: variant.finalPrice,
                name: variant.name,
            };
            productListFinal.push({
              checkoutItem: product,
              quantity: item.quantity,
            });
        }
        return productListFinal;
    };
}

export default new CheckoutService();
