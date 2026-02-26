
import { AIConversationSessionModel, IConversationSession } from '../../models/ai-conversation-session/ai-conversation-session.model';
import { BaseRepository } from '../base.repository';

export class AIConversationRepository extends BaseRepository<IConversationSession> {
    constructor() {
        super(AIConversationSessionModel);
    }
    getAIConversationWithLazyLoad = async ({
        limit = 10,
        lastItem = undefined,
        search = undefined
    }: {
        lastItem: number | undefined;
        limit?: number;
        search?: string | undefined;
    }) => {
        const pipeline: any[] = [
          {
            $lookup: {
              from: "customers", // tên collection Mongo (không phải model name)
              localField: "customerId",
              foreignField: "_id",
              as: "customer",
            },
          },
          { $unwind: "$customer" },
        ];
        if (search) {
          pipeline.push({
            $match: {
              "customer.name": new RegExp(search, "gi"),
            },
          });
        }
        if (lastItem) {
            pipeline.push({
              $match: {
                lastInteractionAt: { $lt: lastItem },
              },
            });
        }
        pipeline.push(
          { $sort: { lastInteractionAt: -1 } },
          { $limit: limit }
        );
        const messageList = await AIConversationSessionModel.aggregate(pipeline);
        return messageList;
    };
}

export const aiConversationRepository = new AIConversationRepository();
