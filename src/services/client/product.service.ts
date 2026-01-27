import { CheckoutSource } from '../../config/enums/checkout.enum';
import { ProductType } from '../../config/enums/prodcuts.enum';
import {
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { productRepository } from '../../repositories/product/product.repository';
import { OrderProductClientCreate } from '../../types/order/order-product';
import { ProductConfigManufacturing } from '../../types/product/product/product.dto';

class ProductService {
    
    /**
     * Hàm giúp chuyển mảng product gửi lên thành định dạng gia công
     * @param {ProductConfigManufacturing} payload - the payload contains the products and parameters
     * @returns {Promise<OrderProductClientCreate>} - the promise will return an OrderProductClientCreate object
     * @throws {ConflictRequestError} - if the products sent in the payload is not valid
     * @throws {NotFoundRequestError} - if the product is not found in the database
     */
    async configProductManufacturing(
        payload: ProductConfigManufacturing
    ): Promise<OrderProductClientCreate> {
        if (payload.products.length > 2) {
            throw new ConflictRequestError('Vui lòng chọn tối đa 2 mặt hàng!');
        }
        const productFinal: OrderProductClientCreate = {
            quantity: 1,
        };
        const items = [];
        for (const product of payload.products) {
            const item = await productRepository.findOne({
                _id: product.id,
                'variants.sku': product.sku,
            });
            if (!item) {
                throw new NotFoundRequestError('Mặt hàng không tồn tại!');
            }
            items.push(item);
        }

        if (items.length == 1) {
            // nếu chỉ có 1 sp thì phải là lens
            if (items[0].type != ProductType.LENS) {
                throw new ConflictRequestError('Vui lòng chọn thêmn tròng!');
            }
            productFinal.lens = {
                lens_id: payload.products[0].id,
                parameters: payload.parameters,
                sku: payload.products[0].sku,
            };
        } else {
            // nêu gửi lên 2 sp thì phải là gọng và tròng
            if (
                items[0].type == ProductType.LENS &&
                items[1].type != ProductType.LENS
            ) {
                productFinal.lens = {
                    lens_id: payload.products[0].id,
                    parameters: payload.parameters,
                    sku: payload.products[0].sku,
                };
                productFinal.product = {
                    product_id: payload.products[1].id,
                    sku: payload.products[1].sku,
                };
            } else if (
                items[0].type != ProductType.LENS &&
                items[1].type == ProductType.LENS
            ) {
                productFinal.lens = {
                    lens_id: payload.products[1].id,
                    parameters: payload.parameters,
                    sku: payload.products[1].sku,
                };
                productFinal.product = {
                    product_id: payload.products[0].id,
                    sku: payload.products[0].sku,
                };
            } else {
                throw new ConflictRequestError(
                    'Vui lòng chọn thêm gọng hoặc tròng!'
                );
            }
        }

        if (payload.source === CheckoutSource.CART) {
            //  loại item trong cart, add item mới vào
        }
        return productFinal;
    }
}
export default new ProductService();
