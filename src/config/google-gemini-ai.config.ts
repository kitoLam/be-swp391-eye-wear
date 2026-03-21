import { GoogleGenerativeAI } from '@google/generative-ai';

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const model = genAI.getGenerativeModel({
    model: 'gemma-3-27b-it',
});

export const EMBEDDING_MODEL_NAME = 'gemini-embedding-2-preview';

export const embeddingModel = genAI.getGenerativeModel({
    model: EMBEDDING_MODEL_NAME,
});
