import { Request, Response } from "express";
import { BadRequestError } from "../../errors/apiError/api-error";
import aiConversationService from "../../services/client/ai-conversation.service";
import { ApiResponse } from "../../utils/api-response";

class AIConversationController {
  chatWithSaleAISuggestion = async (req: Request, res: Response) => {
    const message = req.body.message || '';
    if(!message) {
      throw new BadRequestError('Message is required');
    }
    const customerId = req.customer!.id;
    const result = await aiConversationService.handleChat(customerId ,message);
    res.json(ApiResponse.success('Chat successfully', result));
  }
}

export default new AIConversationController();