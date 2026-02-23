import { productRepository } from '../../repositories/product/product.repository';
import { preOrderImportRepository } from '../../repositories/pre-order-import/pre-order-import.repository';
import { adminAccountRepository } from '../../repositories/admin-account/admin-account.repository';
import { PreOrderImportRequest } from '../../types/pre-order-import/pre-order-import';
import { AuthAdminContext } from '../../types/context/context';
import {
    NotFoundRequestError,
    ForbiddenRequestError,
    BadRequestError,
} from '../../errors/apiError/api-error';
import { PreOrderImportStatus } from '../../config/enums/pre-order-import.enum';
import { RoleType } from '../../config/enums/admin-account';
import moment from 'moment';
import { ProductVariantMode } from '../../config/enums/product.enum';

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
        const variantDetail = product.variants.find((v) => v.sku === sku);
        if(!variantDetail || variantDetail.mode != ProductVariantMode.PRE_ORDER){
            throw new BadRequestError(`Product variant with SKU: ${sku} is not a pre-order variant`);
        }
        // 3. Create the pre-order-import record
        const preOrderImport = await preOrderImportRepository.create({
            sku,
            description,
            targetDate: moment(payload.targetDate, 'DD-MM-YYYY').startOf('date').toDate(),
            targetQuantity,
            managerResponsibility: context.id,
            status: PreOrderImportStatus.PENDING,
            startedDate: moment(payload.startedDate, 'DD-MM-YYYY').startOf('date').toDate(),
            endedDate: moment(payload.endedDate, 'DD-MM-YYYY').endOf('date').toDate()
        });

        return preOrderImport;
    }

    async cancelPreOrderImport(
        preOrderImportId: string,
        context: AuthAdminContext
    ) {
        // 1. Verify that the user is a MANAGER
        const adminAccount = await adminAccountRepository.findById(context.id);

        if (!adminAccount) {
            throw new NotFoundRequestError('Admin account not found');
        }

        if (adminAccount.role !== RoleType.MANAGER) {
            throw new ForbiddenRequestError(
                'Only managers can cancel pre-order imports'
            );
        }

        // 2. Verify pre-order exists
        const preOrderImport = await preOrderImportRepository.findById(
            preOrderImportId
        );

        if (!preOrderImport) {
            throw new NotFoundRequestError(
                `Pre-order import with ID: ${preOrderImportId} not found`
            );
        }

        // 3. Verify pre-order is PENDING
        if (preOrderImport.status !== PreOrderImportStatus.PENDING) {
            throw new BadRequestError(
                `Cannot cancel pre-order import with status: ${preOrderImport.status}. Only PENDING pre-orders can be cancelled.`
            );
        }

        // 4. Update status to CANCELLED
        const updatedPreOrder = await preOrderImportRepository.update(
            preOrderImportId,
            {
                status: PreOrderImportStatus.CANCELLED,
            }
        );

        return updatedPreOrder;
    }

    async getPreOrderImportsBySku(sku: string, targetDate?: string) {
        const filter: any = { sku };

        if (targetDate) {
            const queryDate = new Date(targetDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (queryDate <= today) {
                throw new BadRequestError(
                    'Target date must be greater than current date'
                );
            }

            filter.targetDate = { $eq: queryDate };
        }

        return await preOrderImportRepository.findAllNoPagination(filter);
    }
}

export default new PreOrderImportService();
