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
    }: {
        conversationId: string;
        lastMessageAt: number | undefined;
        limit?: number;
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

        const messageList = await AIMessageModel.find(dbFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return messageList;
    };
}

export const aiMessageRepository = new AIMessageRepository();
