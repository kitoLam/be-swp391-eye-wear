import { Router } from "express";
import aiMessageController from "../../controllers/client/ai-message.controller";
import { authenticateMiddlewareClient } from "../../middlewares/client/auth.middleware";
import { validateQuery } from "../../middlewares/share/validator.middleware";
import { AIMessageListQuerySchema } from "../../types/ai-message/query";

const router = Router();
router.use(authenticateMiddlewareClient);
router.get('/', validateQuery(AIMessageListQuerySchema), aiMessageController.getMessageList);

export default router;