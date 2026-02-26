import { Request, Response } from "express";
import { ApiResponse } from "../../utils/api-response";
import { AIConversationListQuery } from "../../types/ai-conversation/query";
import aiConversationService from "../../services/admin/ai-conversation.service";
import { formatDateToString } from "../../utils/formatter";
import { AIMessageListQueryByAdmin } from "../../types/ai-message/query";

class AIConversationController {
  getConversationList = async (req: Request, res: Response) => {
    const query = req.validatedQuery as AIConversationListQuery;
    const data = await aiConversationService.getAIConversationList(query);
    const finalConversationList = data.conversationList.map((item) => {
      return {
        id: item._id.toString(),
        customerId: item.customerId,
        customerName: item.customer.name,
        lastInteractionAt: formatDateToString(item.lastInteractionAt),
      }
    })
    res.json(ApiResponse.success('Get conversation list successfully', {
      conversationList: finalConversationList,
      pagination: data.pagination
    }));
  }
  getMessageListByConversation = async (req: Request, res: Response) => {
    const conversationId = req.params.id as string;
    const query = req.query as AIMessageListQueryByAdmin;
    
    const data = await aiConversationService.getMessageListByConversation(conversationId, query);

    const messageListFinal = data.messageList.map((item) => {
      return {
        "id": item._id.toString(),
        "role": item.role,
        "conversationId": item.conversationId.toString(),
        "content": item.content,
        "createdAt": formatDateToString(item.createdAt),
      }
    })
    res.json(ApiResponse.success('Get message list successfully', {
      messageList: messageListFinal,
      pagination: data.pagination
    }));
  }
}

export default new AIConversationController();