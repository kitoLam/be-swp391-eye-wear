import {
    AIMessageModel,
    IAIMessage,
} from '../../models/ai-message/ai-message.model';
import { BaseRepository } from '../base.repository';

export class AIMessageRepository extends BaseRepository<IAIMessage> {
    constructor() {
        super(AIMessageModel);
    }
    getAIMessageWithLazyLoad = async ({
        conversationId,
        limit = 10,
        lastMessageAt = undefined,
        search,
    }: {
        conversationId: string;
        lastMessageAt: number | undefined;
        limit?: number;
        search?: string;
    }) => {
        const dbFilter: { [key: string]: any } = {
            conversationId,
        };

        // Nếu có lastMessageId, lấy messages cũ hơn message đó
        if (lastMessageAt) {
            const lastMessage = await AIMessageModel.findOne({
                createdAt: lastMessageAt,
            })
                .select('createdAt')
                .lean();

            if (lastMessage) {
                dbFilter.createdAt = {
                    $lt: lastMessage.createdAt,
                };
            }
        }
        if(search){
            dbFilter.content = new RegExp(search, 'gi');
        }
        const messageList = await AIMessageModel.find(dbFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return messageList;
    };

    getRecentMessages = async (conversationId: string, limit: number = 10) => {
        const messages = await AIMessageModel.find({ conversationId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Return in chronological order (oldest first)
        return messages.reverse();
    };
}

export const aiMessageRepository = new AIMessageRepository();
