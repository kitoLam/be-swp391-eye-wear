import { model } from '../../config/google-gemini-ai.config';
import { AIConversationSessionModel } from '../../models/ai-conversation-session/ai-conversation-session.model';
import { buildAnswerPrompt, buildIntentClassificationPrompt, buildInfoResponsePrompt } from '../../utils/prompt.util';
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

        // Save user message
        await aiMessageService.createMessage('CUSTOMER', session._id.toString(), message);
        // Step 1: Classify intent (SHOPPING or INFO)
        const classificationPrompt = buildIntentClassificationPrompt(message);
        const classificationResult = await model.generateContent(classificationPrompt);
        const classificationText = classificationResult.response.text();

        let intentClassification;
        try {
            const jsonMatch = classificationText.match(/\{[\s\S]*\}/);
            intentClassification = jsonMatch ? JSON.parse(jsonMatch[0]) : { intentType: 'SHOPPING' };
        } catch (error) {
            console.error('Error parsing intent classification:', error);
            intentClassification = { intentType: 'SHOPPING' }; // Default to SHOPPING if parsing fails
        }

        console.log('>>> Intent Classification:', intentClassification);

        let aiResponse: string;

        if (intentClassification.intentType === 'INFO') {
            // Handle INFO: Direct response without product search
            const infoPrompt = buildInfoResponsePrompt(message);
            const infoResult = await model.generateContent(infoPrompt);
            aiResponse = infoResult.response.text();
            console.log('>>> INFO intent - Direct response');
        } else {
            // Get message history for intent classification
            const messageHistory = await aiMessageService.getRecentMessages(session._id.toString(), 10);
            const formattedHistory = messageHistory
                .map((msg: any) => `${msg.sender === 'CUSTOMER' ? 'Khách' : 'AI'}: ${msg.message}`)
                .join('\n');
            // Handle SHOPPING: Original flow with embedding and product search
            const { paraphrasedIntent, products } = await productService.buildQueryForAISuggestion(messageHistory);
            console.log(">>>paraphrased intent::", paraphrasedIntent);
            console.log(`>>> id match:${products.length} products:`, products.map(item => item._id.toString()).join(","));

            const prompt = buildAnswerPrompt(paraphrasedIntent, products);
            const result = await model.generateContent(prompt);
            aiResponse = result.response.text();
            console.log('>>> SHOPPING intent - Product search executed');
        }

        await aiMessageService.createMessage('AI', session._id.toString(), aiResponse);
        await session.save();

        return { message: aiResponse };
    }
}

export default new AIConversation();
