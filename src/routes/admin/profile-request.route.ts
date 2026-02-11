import { Router } from "express";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/share/validator.middleware";
import { SendProfileRequestSchema } from "../../types/profile-request/profile-request.request";
import profileRequestController from '../../controllers/admin/profile-request.controller';
import { GetProfileRequestListQuerySchema } from "../../types/profile-request/profile-request.query";
import { ObjectIdSchema } from "../../types/common/objectId";
const router = Router();
router.use(authenticateMiddleware);

// list, detail
router.get('/', validateQuery(GetProfileRequestListQuerySchema), profileRequestController.getProfileRequestList);
router.get('/:id', validateParams(ObjectIdSchema), profileRequestController.getRequestDetail);

// oper, sale gửi yêu cầu thay đổi lên manager
router.post('/', validateBody(SendProfileRequestSchema), profileRequestController.sendProfileUpdateRequest);
// manager approve
router.patch('/:id/status/approved', validateParams(ObjectIdSchema), profileRequestController.approveProfileRequest);
// manager reject
router.patch('/:id/status/rejected', validateParams(ObjectIdSchema), profileRequestController.rejectProfileRequest);
// oper, sale cancel
router.patch('/:id/status/cancelled', validateParams(ObjectIdSchema), profileRequestController.cancelProfileRequest);