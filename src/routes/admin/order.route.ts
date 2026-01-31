import { Router } from "express";
import orderController from "../../controllers/admin/order.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/share/validator.middleware";
import { AssignOrderSchema } from "../../types/order/order.request";
import { ObjectIdSchema } from "../../types/common/objectId";
import { OrderListAdminQuerySchema } from "../../types/order/order.query";
const router = Router();
router.use(authenticateMiddleware);
// api lấy danh sách order theo staffId và admin đang đăng nhập
router.get('/', validateQuery(OrderListAdminQuerySchema), orderController.getOrdersByStaff);
router.get('/:id', validateParams(ObjectIdSchema), orderController.getOrderDetail);
// ============== MANAGER ================
router.patch('/:id/status/assign', validateParams(ObjectIdSchema), validateBody(AssignOrderSchema), orderController.assignOrder);
// ============== END MANAGER ================

// ============== OPERATION ================
router.patch('/:id/status/making', validateParams(ObjectIdSchema), orderController.makingOrder);
router.patch('/:id/status/packaging', validateParams(ObjectIdSchema), orderController.packagingOrder);
router.patch('/:id/status/complete', validateParams(ObjectIdSchema), orderController.completeOrder);
// ============== END OPERATION ================

export default router;
