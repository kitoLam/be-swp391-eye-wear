import { Router } from 'express';
import preOrderImportClientController from '../../controllers/client/pre-order-import.controller';

const router = Router();

/**
 * GET /client/pre-order-import/sku/:sku
 * Get pre-order import detail by SKU
 * @returns {
 *   "success": true,
 *   "message": "Pre-order import detail retrieved successfully",
 *   "data": {
 *     "_id": "697c74ab31e0c88affdffc2d",
 *     "sku": "FRAME-001-01",
 *     "description": "Pre-order 100 gọng kính đen size M",
 *     "targetDate": "2026-03-01T00:00:00.000Z",
 *     "targetQuantity": 100,
 *     "preOrderedQuantity": 50,
 *     "managerResponsibility": "69785ba5cb02b6ef2f922574",
 *     "startedDate": "2026-01-15T00:00:00.000Z",
 *     "endedDate": "2026-02-28T23:59:59.999Z",
 *     "status": "pending",
 *     "deletedAt": null,
 *     "createdAt": "2026-01-30T09:06:51.595Z",
 *     "updatedAt": "2026-01-30T09:06:51.595Z"
 *   }
 * }
 */
router.get(
    '/sku/:sku',
    preOrderImportClientController.getPreOrderImportDetailBySku
);

export default router;
