import { Router } from "express";
import aiConversationController from "../../controllers/client/ai-conversation.controller";
import { authenticateMiddlewareClient } from "../../middlewares/client/auth.middleware";

const router = Router();
router.use(authenticateMiddlewareClient);
router.post('/chat', aiConversationController.chatWithSaleAISuggestion);

export default router;