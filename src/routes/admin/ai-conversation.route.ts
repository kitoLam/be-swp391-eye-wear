import { Router } from "express";
import aiConversationController from "../../controllers/admin/ai-conversation.controller";
import { authenticateMiddleware } from "../../middlewares/admin/auth.middleware";
import { validateParams, validateQuery } from "../../middlewares/share/validator.middleware";
import { AIConversationListQuerySchema } from "../../types/ai-conversation/query";
import { ObjectIdSchema } from "../../types/common/objectId";
import { AIMessageListQueryByAdminSchema } from "../../types/ai-message/query";

const router = Router();
router.use(authenticateMiddleware);
router.get('/', validateQuery(AIConversationListQuerySchema), aiConversationController.getConversationList);
router.get('/:id/messages', validateParams(ObjectIdSchema), validateQuery(AIMessageListQueryByAdminSchema), aiConversationController.getMessageListByConversation);
export default router;