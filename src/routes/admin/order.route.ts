import { Router } from 'express';
import orderController from '../../controllers/admin/order.controller';
import { authenticateMiddleware } from '../../middlewares/admin/auth.middleware';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/share/validator.middleware';
import {
    ApproveOrderSchema,
    AssignOrderSchema,
} from '../../types/order/order.request';
import { ObjectIdSchema } from '../../types/common/objectId';
import {
    OrderCountTotalQuerySchema,
    OrderListAdminQuerySchema,
    OrderStatsQuerySchema,
} from '../../types/order/order.query';
import { requireAdminRoles } from '../../middlewares/admin/authorization.middleware';
import { RoleType } from '../../config/enums/admin-account';
const router = Router();
router.use(authenticateMiddleware);
// api lấy danh sách order theo staffId và admin đang đăng nhập
router.get(
    '/',
    validateQuery(OrderListAdminQuerySchema),
    orderController.getOrdersList
);
router.get(
    '/total',
    validateQuery(OrderCountTotalQuerySchema),
    orderController.countTotalOrders
);
router.get(
    '/:id',
    validateParams(ObjectIdSchema),
    orderController.getOrderDetail
);
// ============== MANAGER ================
router.patch(
    '/:id/status/assign',
    requireAdminRoles([RoleType.MANAGER]),
    validateParams(ObjectIdSchema),
    validateBody(AssignOrderSchema),
    orderController.assignOrder
);
// ============== END MANAGER ================

// =============== SALE ======================
router.patch(
    '/:id/status/approve',
    validateParams(ObjectIdSchema),
    validateBody(ApproveOrderSchema),
    orderController.approveOrder
);
// =============== END SALE ==================

// ============== OPERATION ================
router.patch(
    '/:id/status/making',
    requireAdminRoles([RoleType.OPERATION_STAFF]),
    validateParams(ObjectIdSchema),
    orderController.makingOrder
);
router.patch(
    '/:id/status/packaging',
    requireAdminRoles([RoleType.OPERATION_STAFF]),
    validateParams(ObjectIdSchema),
    orderController.packagingOrder
);
router.patch(
    '/:id/status/complete',
    requireAdminRoles([RoleType.OPERATION_STAFF]),
    validateParams(ObjectIdSchema),
    orderController.completeOrder
);
// ============== END OPERATION ================

router.get(
    '/stats/summary',
    validateQuery(OrderStatsQuerySchema),
    orderController.getOrderSummary
);
router.get(
    '/stats/pending-breakdown',
    validateQuery(OrderStatsQuerySchema),
    orderController.getOrderPendingBreakdown
);
export default router;
