import { NotFoundRequestError } from '../../errors/apiError/api-error';
import { AIConversationSessionModel } from '../../models/ai-conversation-session/ai-conversation-session.model';
import { aiConversationRepository } from '../../repositories/ai-conversation/ai-conversation.repository';
import { aiMessageRepository } from '../../repositories/ai-message/ai-message.repository';
import { AIConversationListQuery } from '../../types/ai-conversation/query';
import { AIMessageListQueryByAdmin } from '../../types/ai-message/query';

class AIConversationService {
    getAIConversationList = async (query: AIConversationListQuery) => {
        const limit = 10;
        const filter: any = {};
        if (query.lastItem) {
            filter.lastItem = query.lastItem;
        }
        if (query.search) {
            filter.search = query.search;
        }

        const conversationList =
            await aiConversationRepository.getAIConversationWithLazyLoad({
                ...filter,
                limit,
            });
        return {
            conversationList: conversationList,
            pagination: {
                hasNext: conversationList.length == limit,
                lastItem:
                    conversationList.length != 0
                        ? conversationList[
                              conversationList.length - 1
                          ].lastInteractionAt.getTime()
                        : null,
            },
        };
    };

    getMessageListByConversation = async (
        conversationId: string,
        query: AIMessageListQueryByAdmin
    ) => {
        const limit = 12;
        const foundCustomerConversation =
            await AIConversationSessionModel.findOne({
                _id: conversationId,
            });
        if (!foundCustomerConversation) {
            throw new NotFoundRequestError('Not found conversation');
        }
        const messages = await aiMessageRepository.getAIMessageWithLazyLoad({
            conversationId: foundCustomerConversation._id.toString(),
            lastMessageAt: query.lastItem,
            search: query.search,
            limit,
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
}

export default new AIConversationService();
