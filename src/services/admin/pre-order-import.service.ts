import { productRepository } from '../../repositories/product/product.repository';
import { preOrderImportRepository } from '../../repositories/pre-order-import/pre-order-import.repository';
import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
import { PreOrderImportRequest } from '../../types/pre-order-import/pre-order-import';
import { AuthAdminContext } from '../../types/context/context';
import {
    NotFoundRequestError,
    ForbiddenRequestError,
} from '../../errors/apiError/api-error';
import { PreOrderImportStatus } from '../../config/enums/pre-order-import.enum';
import { RoleType } from '../../config/enums/admin-account';

class PreOrderImportService {
    async createPreOrderImport(
        payload: PreOrderImportRequest,
        context: AuthAdminContext
    ) {
        const { sku, description, targetDate, targetQuantity } = payload;

        // 1. Verify that the user is a MANAGER
        const adminAccount = await adminAccountRepository.findById(context.id);

        if (!adminAccount) {
            throw new NotFoundRequestError('Admin account not found');
        }

        if (adminAccount.role !== RoleType.MANAGER) {
            throw new ForbiddenRequestError(
                'Only managers can create pre-order imports'
            );
        }

        // 2. Verify that the product variant with the given SKU exists
        const product = await productRepository.findOne({
            'variants.sku': sku,
        });

        if (!product) {
            throw new NotFoundRequestError(
                `Product variant with SKU: ${sku} not found`
            );
        }

        // 3. Create the pre-order-import record
        const preOrderImport = await preOrderImportRepository.create({
            sku,
            description,
            targetDate,
            targetQuantity,
            managerResponsibility: context.id,
            status: PreOrderImportStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        });

        return preOrderImport;
    }
}

export default new PreOrderImportService();
