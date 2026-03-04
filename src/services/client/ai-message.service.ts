import { NotFoundRequestError } from '../../errors/apiError/api-error';
import { AIConversationSessionModel } from '../../models/ai-conversation-session/ai-conversation-session.model';
import { aiMessageRepository } from '../../repositories/ai-message/ai-message.repository';
import { AIMessageListQuery } from '../../types/ai-message/query';

class AIMessageService {
    getAIMessageList = async (
        customerId: string,
        query: AIMessageListQuery,
        limit: number = 10,
    ) => {
        const foundCustomerConversation = await AIConversationSessionModel.findOne({
            customerId: customerId,
        });
        if(!foundCustomerConversation){
            throw new NotFoundRequestError("Not found conversation session");
        }
        const messages = await aiMessageRepository.getAIMessageWithLazyLoad({
            conversationId: foundCustomerConversation._id.toString(),
            lastMessageAt: query.lastMessageAt,
            limit
        });
        messages.sort((a, b) =>
            a.createdAt.getTime() > b.createdAt.getTime() ? 1 : -1
        );
        return {
            messageList: messages,
            pagination: {
                hasNext: messages.length == limit,
                lastItem:
                    messages.length != 0
                        ? messages[0].createdAt.getTime()
                        : null,
            },
        };
    };

    createMessage = async (
        role: 'AI' | 'CUSTOMER',
        conversationId: string,
        content: string
    ) => {
        const newMessage = await aiMessageRepository.create({
            role,
            conversationId,
            content,
        });
        return newMessage;
    };

    getRecentMessages = async (conversationId: string, limit: number = 10) => {
        const messages = await aiMessageRepository.getRecentMessages(conversationId, limit);
        return messages;
    };
}

export default new AIMessageService();
