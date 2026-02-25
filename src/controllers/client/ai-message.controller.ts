import { Request, Response } from "express";
import { AIMessageListQuery } from "../../types/ai-message/query";
import aiMessageService from "../../services/client/ai-message.service";
import { ApiResponse } from "../../utils/api-response";

class AIMessageController {
  getMessageList = async (req: Request, res: Response) => {
    const query: AIMessageListQuery = req.query as AIMessageListQuery;
    const result = await aiMessageService.getAIMessageList(req.customer!.id, query);
    res.json(ApiResponse.success("Get message list successfully", result));
  }
}

export default new AIMessageController();