import { preOrderImportRepository } from '../../repositories/pre-order-import/pre-order-import.repository';
import { NotFoundRequestError } from '../../errors/apiError/api-error';
import { PreOrderImportStatus } from '../../config/enums/pre-order-import.enum';

class PreOrderImportClientService {
    /**
     * Get pre-order import detail by SKU
     */
    async getPreOrderImportDetailBySku(sku: string) {
        // Find active pre-order import by SKU
        const preOrderImport = await preOrderImportRepository.findOne({
            sku: sku,
            status: PreOrderImportStatus.PENDING,
            deletedAt: null,
        });

        if (!preOrderImport) {
            throw new NotFoundRequestError(
                `Pre-order import with SKU: ${sku} not found`
            );
        }

        return preOrderImport;
    }
}

export default new PreOrderImportClientService();
