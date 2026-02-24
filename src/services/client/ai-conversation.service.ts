import { model } from '../../config/google-gemini-ai.config';
import { AIConversationSessionModel } from '../../models/ai-conversation-session/ai-conversation-session.model';
import { buildAnswerPrompt } from '../../utils/prompt.util';
import {
    extractIntentByLLM,
    isReadyToRecommend,
    mergeIntent,
} from '../../utils/sale-ai.util';
import { isAISessionExpired, resetSession } from '../../utils/sale-ai.util';
import productService from './product.service';
class AIConversation {
    async handleChat(customerId: string, message: string) {
        let session = await AIConversationSessionModel.findOne({ customerId });

        if (!session) {
            session = await AIConversationSessionModel.create({ customerId });
        }

        // check timeout
        if (isAISessionExpired(session.lastInteractionAt)) {
            resetSession(session);
        }
        session.lastInteractionAt = new Date();
        // end checkout timeout

        // extract intent from user message
        const extracted = await extractIntentByLLM(message);
        console.log(">>>extracted::", extracted);
        session.intent = mergeIntent(session.intent, extracted );
        console.log("current intent::", session.intent);
        if (extracted.isRefinement && session.stage === 'RECOMMENDING') {
            session.stage = 'REFINING';
        }
        // end extracting intent from user message;

        /**
         * =====================
         * DISCOVERY
         * =====================
         */
        if (session.stage === 'DISCOVERY') {
            if (!isReadyToRecommend(session.intent)) {
                await session.save();

                return {
                    message: 'Bạn muốn kính mát hay kính gọng? Và dùng cho nam hay nữ ạ?',
                };
            }

            session.stage = 'RECOMMENDING';
        }

        /**
         * =====================
         * REFINING
         * =====================
         */
        if (session.stage === 'REFINING') {
            const products = await productService.buildQueryForAISuggestion(session.intent);

            const prompt = buildAnswerPrompt(message, products);
            const result = await model.generateContent(prompt);

            session.stage = 'RECOMMENDING';
            await session.save();

            return { message: result.response.text() };
        }

        /**
         * =====================
         * RECOMMENDING (default)
         * =====================
         */
        const products = await productService.buildQueryForAISuggestion(session.intent);

        const prompt = buildAnswerPrompt(message, products);
        const result = await model.generateContent(prompt);
        await session.save();

        return { message: result.response.text() };
    }
}

export default new AIConversation();
