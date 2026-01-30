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

class ImportProductService {
    async importProduct(
        payload: ImportProductRequest,
        context: AuthAdminContext
    ) {
        const { sku, quantity, preOrderImportId } = payload;

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
                $inc: { 'variants.$.stock': quantity },
                $set: { 'variants.$.updatedAt': new Date() },
            }
        );

        // 7. Update pre-order status to DONE
        await preOrderImportRepository.update(preOrderImportId, {
            status: PreOrderImportStatus.DONE,
        });

        return { message: 'Product imported successfully', preOrderImport };
    }
}

export default new ImportProductService();
