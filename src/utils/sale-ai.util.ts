import { model } from '../config/google-gemini-ai.config';
import { buildIntentPrompt } from './prompt.util';
export function isAISessionExpired(lastInteractionAt: Date): boolean {
    const now = Date.now();
    const last = new Date(lastInteractionAt).getTime();

    return now - last > 30 * 60 * 1000;
}
export function resetSession(session: any) {
    session.intent = {};
    session.stage = 'DISCOVERY';
}

export async function extractIntentByLLM(message: string) {
    const prompt = buildIntentPrompt(message);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    try {
        // clean markdown nếu Gemini bọc ```json
        const cleaned = text.replace(/```json|```/g, '').trim();
        console.log('>>>> cleaned text::', cleaned);
        return JSON.parse(cleaned);
    } catch (err) {
        console.error('AI JSON parse failed:', text);
        return {}; // fallback để tránh crash
    }
}
export function isReadyToRecommend(intent: any) {
    return intent.type && intent.gender;
}
export function mergeIntent(oldIntent: any, patch: any) {
  const newIntent = { ...oldIntent };

  for (const key of Object.keys(patch)) {
    const value = patch[key];

    if (value === undefined) continue;

    newIntent[key] = value;
  }

  return newIntent;
}