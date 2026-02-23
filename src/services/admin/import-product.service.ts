import { productRepository } from '../../repositories/product/product.repository';
import { importProductRepository } from '../../repositories/import-product/import-product.repository';
import { preOrderImportRepository } from '../../repositories/pre-order-import/pre-order-import.repository';
import { ImportProductRequest } from '../../types/import-product/import-product';
import { AuthAdminContext } from '../../types/context/context';
import {
    NotFoundRequestError,
    BadRequestError,
} from '../../errors/apiError/api-error';
import { PreOrderImportStatus } from '../../config/enums/pre-order-import.enum';
import { orderRepository } from '../../repositories/order/order.repository';
import { OrderStatus, OrderType } from '../../config/enums/order.enum';
import { OrderModel } from '../../models/order/order.model.mongo';
import { ProductModel } from '../../models/product/product.model.mongo';

class ImportProductService {
    async importProduct(
        payload: ImportProductRequest,
        context: AuthAdminContext
    ) {
        const { sku, quantity, preOrderImportId } = payload;
        if (preOrderImportId) {
            // 1. Verify pre-order-import exists
            const preOrderImport =
                await preOrderImportRepository.findById(preOrderImportId);

            if (!preOrderImport) {
                throw new NotFoundRequestError(
                    `Pre-order import with ID: ${preOrderImportId} not found`
                );
            }

            // 2. Verify SKU matches the pre-order
            if (preOrderImport.sku !== sku) {
                throw new BadRequestError(
                    `SKU mismatch: Pre-order is for SKU ${preOrderImport.sku}, but import is for ${sku}`
                );
            }

            // 3. Verify pre-order is still pending
            if (preOrderImport.status !== PreOrderImportStatus.PENDING) {
                throw new BadRequestError(
                    `Pre-order import is already ${preOrderImport.status}. Cannot import for completed or cancelled pre-orders.`
                );
            }

            // 4. Find the product containing the variant with the given SKU
            const product = await productRepository.findOne({
                'variants.sku': sku,
            });

            if (!product) {
                throw new NotFoundRequestError(
                    `Product variant with SKU: ${sku} not found`
                );
            }

            // 5. Create a record in the import history
            await importProductRepository.create({
                sku,
                quantity,
                staffResponsible: context.id,
                preOrderImportId,
            });

            // 6. Update the stock and updatedAt for the specific variant
            await productRepository.updateByFilter(
                { 'variants.sku': sku },
                {
                    $inc: { 'variants.$.stock': (preOrderImport.targetQuantity - preOrderImport.preOrderedQuantity) },
                    $set: { 'variants.$.updatedAt': new Date() },
                }
            );

            // 7. Update pre-order status to DONE
            await preOrderImportRepository.update(preOrderImportId, {
                status: PreOrderImportStatus.DONE,
            });
            // 8. Với mỗi order là pre-order với sku này sẽ chuyển status của nó từ WAITING_STOCK -> ASSIGNED
            await ProductModel.findOneAndUpdate(
                { "variants.sku": sku }, // Tìm Product có chứa variant mang SKU này
                { 
                    $set: { "variants.$[v].mode": "AVAILABLE" } // "v" là biến đại diện cho phần tử thỏa mãn arrayFilters
                },
                { 
                    arrayFilters: [{ "v.sku": sku }], // Chỉ lọc những variant có SKU khớp để update
                    new: true // Trả về dữ liệu sau khi đã update thành công
                }
            );
            await OrderModel.updateMany(
                {
                    type: { $in: [OrderType.PRE_ORDER] },
                    "products.product.sku": sku
                },
                {
                    // Cập nhật giá trị bên trong mảng
                    $set: {
                        "status": OrderStatus.ASSIGNED
                    } 
                },
                {
                    // Bộ lọc để tìm đúng phần tử trong mảng products của từng Order
                    arrayFilters: [{ "elem.product.sku": sku }]
                }
            );
        }
        else {
            const product = await productRepository.findOne({
                'variants.sku': sku,
            });

            if (!product) {
                throw new NotFoundRequestError(
                    `Product variant with SKU: ${sku} not found`
                );
            }

            await importProductRepository.create({
                sku,
                quantity,
                staffResponsible: context.id,
                preOrderImportId,
            });

            await productRepository.updateByFilter(
                { 'variants.sku': sku },
                {
                    $inc: { 'variants.$.stock': quantity },
                    $set: { 'variants.$.updatedAt': new Date() },
                }
            );
        }
    }
}

export default new ImportProductService();
