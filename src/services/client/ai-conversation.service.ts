import { AIConversationSessionModel } from '../../models/ai-conversation-session/ai-conversation-session.model';
import {
    buildAnswerPrompt,
    buildIntentClassificationPrompt,
    buildInfoResponsePrompt,
} from '../../utils/prompt.util';
import { isAISessionExpired, resetSession } from '../../utils/sale-ai.util';
import aiMessageService from './ai-message.service';
import productService from './product.service';
import { ProductModel } from '../../models/product/product.model.mongo';

type ChatCompletionResponse = {
    choices?: Array<{
        message?: {
            role?: string;
            content?: string | Array<{ type?: string; text?: string }>;
        };
    }>;
};

const AISHOP_API_BASE_URL =
    process.env.AISHOP24H_BASE_URL ?? 'https://aishop24h.com/v1';
const AISHOP_MODEL =
    process.env.AISHOP24H_MODEL ?? 'google/gemini-2.0-flash-lite';
const AISHOP_API_KEY = process.env.AISHOP24H_API_KEY;

async function callAishopTextCompletion(
    prompt: string,
    systemPrompt: string,
    temperature = 0.2
): Promise<string> {
    if (!AISHOP_API_KEY) {
        return '';
    }

    const response = await fetch(
        `${AISHOP_API_BASE_URL.replace(/\/$/, '')}/chat/completions`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${AISHOP_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: AISHOP_MODEL,
                temperature,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
            }),
        }
    );

    if (!response.ok) {
        return '';
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const assistantChoice = payload.choices?.find(
        item => item.message?.role === 'assistant'
    );
    const content =
        assistantChoice?.message?.content ??
        payload.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
        return content.trim();
    }
    if (Array.isArray(content)) {
        return content
            .map(part => part.text ?? '')
            .join(' ')
            .trim();
    }
    return '';
}

class AIConversation {
    async getConversationByCustomerId(customerId: string) {
        let session = await AIConversationSessionModel.findOne({ customerId });

        if (!session) {
            session = await AIConversationSessionModel.create({ customerId });
            await aiMessageService.createMessage(
                'AI',
                session._id.toString(),
                'Xin chào tôi là nhân viên bán của shop, tôi có thể giúp gì cho bạn ?'
            );
        }
        return session;
    }

    async handleChat(customerId: string, message: string) {
        let session = await AIConversationSessionModel.findOne({ customerId });

        if (!session) {
            session = await AIConversationSessionModel.create({ customerId });
        }

        if (isAISessionExpired(session.lastInteractionAt)) {
            resetSession(session);
        }
        session.lastInteractionAt = new Date();

        await aiMessageService.createMessage(
            'CUSTOMER',
            session._id.toString(),
            message
        );

        const classificationPrompt = buildIntentClassificationPrompt(message);
        const classificationText =
            (await callAishopTextCompletion(
                classificationPrompt,
                'Bạn phân loại intent khách hàng thành SHOPPING hoặc INFO và trả JSON.',
                0
            )) || '{"intentType":"SHOPPING","confidence":"low"}';

        let intentClassification;
        try {
            const jsonMatch = classificationText.match(/\{[\s\S]*\}/);
            intentClassification = jsonMatch
                ? JSON.parse(jsonMatch[0])
                : { intentType: 'SHOPPING' };
        } catch (error) {
            console.error('Error parsing intent classification:', error);
            intentClassification = { intentType: 'SHOPPING' };
        }

        console.log('>>> Intent Classification:', intentClassification);

        let aiResponse: string;

        if (intentClassification.intentType === 'INFO') {
            const infoPrompt = buildInfoResponsePrompt(message);
            aiResponse =
                (await callAishopTextCompletion(
                    infoPrompt,
                    'Bạn là nhân viên tư vấn của shop kính, trả lời ngắn gọn đúng ngữ cảnh.',
                    0.3
                )) ||
                'Xin lỗi bạn, hiện tại mình chưa lấy được thông tin phù hợp.';
            console.log('>>> INFO intent - Direct response');
        } else {
            const messageHistory = await aiMessageService.getRecentMessages(
                session._id.toString(),
                1
            );

            const { paraphrasedIntent, products } =
                await productService.buildQueryForAISuggestion(messageHistory);
            console.log('>>> paraphrased intent::', paraphrasedIntent);
            console.log(
                `>>> id match:${products.length} products:`,
                products.map(item => item._id.toString()).join(',')
            );

            // Re-hydrate bằng product detail để đảm bảo có đủ variants/options mới nhất trước khi prompt AI
            const productIds = products.map(item => item._id);
            const productDetails = await ProductModel.find({
                _id: { $in: productIds },
                deletedAt: null,
            }).lean();

            const productDetailMap = new Map<string, any>(
                productDetails.map(item => [String(item._id), item])
            );

            const enrichedProducts = products.map(item => {
                const detailed = productDetailMap.get(String(item._id));
                return detailed ?? item;
            });

            const prompt = buildAnswerPrompt(
                paraphrasedIntent,
                enrichedProducts
            );
            aiResponse =
                (await callAishopTextCompletion(
                    prompt,
                    'Bạn là nhân viên bán kính, tư vấn đúng dữ liệu products, không bịa.',
                    0.3
                )) ||
                'Mình đã tìm được một số sản phẩm, bạn vui lòng thử lại để mình tư vấn chi tiết hơn nhé.';
            console.log('>>> SHOPPING intent - Product search executed');
        }

        await aiMessageService.createMessage(
            'AI',
            session._id.toString(),
            aiResponse
        );
        await session.save();

        return { message: aiResponse };
    }
}

export default new AIConversation();
