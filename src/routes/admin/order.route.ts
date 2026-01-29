import { Router } from "express";
import orderController from "../../controllers/admin/order.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { validateBody, validateParams } from "../../middlewares/share/validator.middleware";
import { AssignOrderSchema } from "../../types/order/order.request";
import { ObjectIdSchema } from "../../types/common/objectId";
const router = Router();
router.use(authenticateMiddleware);
// api lấy danh sách order
// router.get('/');
// ============== MANAGER ================
router.patch('/:id/status/assign', validateParams(ObjectIdSchema), validateBody(AssignOrderSchema), orderController.assignOrder);
// ============== END MANAGER ================

// ============== OPERATION ================
router.patch('/:id/status/making', validateParams(ObjectIdSchema), orderController.makingOrder);
router.patch('/:id/status/packaging', validateParams(ObjectIdSchema), orderController.packagingOrder);
router.patch('/:id/status/complete', validateParams(ObjectIdSchema), orderController.completeOrder);
// ============== END OPERATION ================

export default router;