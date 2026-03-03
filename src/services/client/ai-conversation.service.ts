import { REQUIRE_ASK_SLOT } from '../../config/constants/require-sale-ai-slot.constant';
import { model } from '../../config/google-gemini-ai.config';
import { AIConversationSessionModel } from '../../models/ai-conversation-session/ai-conversation-session.model';
import { buildAnswerPrompt } from '../../utils/prompt.util';
import {
    askForMissingSlots,
    extractIntentByLLM,
    getMissingRequiredSlots,
    isReadyToRecommend,
    mergeIntent,
} from '../../utils/sale-ai.util';
import { isAISessionExpired, resetSession } from '../../utils/sale-ai.util';
import aiMessageService from './ai-message.service';
import productService from './product.service';
class AIConversation {
    async getConversationByCustomerId(customerId: string) {
        let session = await AIConversationSessionModel.findOne({ customerId });

        if (!session) {
            session = await AIConversationSessionModel.create({ customerId });
            await aiMessageService.createMessage('AI', session._id.toString(), "Xin chào tôi là nhân viên bán của shop, tôi có thể giúp gì cho bạn ?");
        }
        return session;
    }

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
        await aiMessageService.createMessage('CUSTOMER', session._id.toString(), message);
        /**
         * =====================
         * DISCOVERY
         * =====================
         */
        if (session.stage === 'DISCOVERY') {
            if (!isReadyToRecommend(session.intent)) {
                const missingSlots = getMissingRequiredSlots(session.intent, REQUIRE_ASK_SLOT);
                const askToDiscoveryMessage = await askForMissingSlots(missingSlots[0], session.intent, message);
                await session.save();
                await aiMessageService.createMessage('AI', session._id.toString(), askToDiscoveryMessage);
                return {
                    message: askToDiscoveryMessage,
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
            const messageHistory = await aiMessageService.getRecentMessages(session._id.toString(), 10);
            const products = await productService.buildQueryForAISuggestion(session.intent, message, messageHistory);
            console.log(">>>products::", products.length);
            for (const item of products) {
                console.log(">>>id match::", item._id);
            }
            const prompt = buildAnswerPrompt(message, products);
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            await aiMessageService.createMessage('AI', session._id.toString(), text);
            session.stage = 'RECOMMENDING';
            await session.save();

            return { message: text };
        }

        /**
         * =====================
         * RECOMMENDING
         * =====================
         */
        const messageHistory = await aiMessageService.getRecentMessages(session._id.toString(), 10);
        const products = await productService.buildQueryForAISuggestion(session.intent, message, messageHistory);
        console.log(">>>products::", products.length);
        for (const item of products) {
            console.log(">>>id match::", item._id);
        }

        const prompt = buildAnswerPrompt(message, products);
        const result = await model.generateContent(prompt);
        await aiMessageService.createMessage('AI', customerId, result.response.text());
        await session.save();

        return { message: result.response.text() };
    }
}

export default new AIConversation();
