import { Router } from 'express';
import { PreOrderImportRequestSchema } from '../../types/pre-order-import/pre-order-import';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import preOrderImportController from '../../controllers/admin/pre-order-import.controller';

const router = Router();

router.post(
    /**
     * {
    "success": true,
    "message": "Pre-order import created successfully",
    "data": {
        "sku": "FRAME-001-01",
        "description": "Pre-order 100 gọng kính đen size M",
        "targetDate": "2026-03-01T00:00:00.000Z",
        "targetQuantity": 100,
        "managerResponsibility": "69785ba5cb02b6ef2f922574",
        "status": "pending",
        "deletedAt": null,
        "_id": "697c74ab31e0c88affdffc2d",
        "createdAt": "2026-01-30T09:06:51.595Z",
        "updatedAt": "2026-01-30T09:06:51.595Z",
        "__v": 0
    }
}
     */
    '/',
    authenticateMiddleware,
    validateBody(PreOrderImportRequestSchema),
    preOrderImportController.createPreOrderImport
);

router.patch(
    '/:id/cancel',
    authenticateMiddleware,
    preOrderImportController.cancelPreOrderImport
);

export default router;
