import { productRepository } from '../../repositories/product/product.repository';
import { importProductRepository } from '../../repositories/import-product/import-product.repository';
import { ImportProductRequest } from '../../types/import-product/import-product';
import { AuthAdminContext } from '../../types/context/context';
import { NotFoundRequestError } from '../../errors/apiError/api-error';

class ImportProductService {
    async importProduct(
        payload: ImportProductRequest,
        context: AuthAdminContext
    ) {
        const { sku, quantity } = payload;

        // 1. Find the product containing the variant with the given SKU
        const product = await productRepository.findOne({ 'variants.sku': sku });

        if (!product) {
            throw new NotFoundRequestError(`Product variant with SKU: ${sku} not found`);
        }

        // 2. Create a record in the import history
        await importProductRepository.create({
            sku,
            quantity,
            staffResponsible: context.id,
        });

        // 3. Update the stock and updatedAt for the specific variant
        await productRepository.updateByFilter(
            { 'variants.sku': sku },
            {
                $inc: { 'variants.$.stock': quantity },
                $set: { 'variants.$.updatedAt': new Date() },
            }
        );

        return { message: 'Product imported successfully' };
    }
}

export default new ImportProductService();

