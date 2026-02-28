import mongoose from 'mongoose';
import { connectMongoDB } from '../config/database/mongodb.config';
import {
    EMBEDDING_MODEL_NAME,
    embeddingModel,
} from '../config/google-gemini-ai.config';
import { ProductModel } from '../models/product/product.model.mongo';

type PlainObject = Record<string, unknown>;

const REQUEST_DELAY_MS = 1200;
const MAX_RETRIES = 5;

function removeIgnoredKeys(value: unknown): unknown {
    const ignoredKeys = new Set([
        'createdAt',
        'updatedAt',
        'deletedAt',
        'embedding',
        'embeddingModel',
        'embeddingUpdatedAt',
        '__v',
    ]);

    if (Array.isArray(value)) {
        return value.map(item => removeIgnoredKeys(item));
    }

    if (value !== null && typeof value === 'object') {
        const obj = value as PlainObject;
        const filtered: PlainObject = {};

        for (const [key, child] of Object.entries(obj)) {
            if (ignoredKeys.has(key)) {
                continue;
            }
            filtered[key] = removeIgnoredKeys(child);
        }

        return filtered;
    }

    return value;
}

function buildEmbeddingText(product: unknown): string {
    const cleaned = removeIgnoredKeys(product);
    return JSON.stringify(cleaned);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
    const status = (error as any)?.status as number | undefined;
    return status === 429 || status === 503;
}

async function getEmbeddingVector(text: string): Promise<number[]> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await embeddingModel.embedContent(text);
            const values = (result as any)?.embedding?.values;

            if (!Array.isArray(values) || values.length === 0) {
                throw new Error('Embedding result is empty or invalid');
            }

            return values as number[];
        } catch (error) {
            lastError = error;

            if (!isRetryableError(error) || attempt === MAX_RETRIES) {
                throw error;
            }

            const backoffMs = REQUEST_DELAY_MS * attempt;
            console.warn(
                `[RETRY] Embed attempt ${attempt}/${MAX_RETRIES} failed. Waiting ${backoffMs}ms...`
            );
            await sleep(backoffMs);
        }
    }

    throw lastError;
}

async function embedAllProducts(): Promise<void> {
    await connectMongoDB();

    const products = await ProductModel.find({ deletedAt: null }).lean();
    console.log(`Found ${products.length} products to embed.`);

    let successCount = 0;
    let failedCount = 0;

    for (const product of products) {
        const productId = product._id.toString();

        try {
            const text = buildEmbeddingText(product);
            const vector = await getEmbeddingVector(text);

            await ProductModel.updateOne(
                { _id: product._id },
                {
                    $set: {
                        embedding: vector,
                        embeddingModel: EMBEDDING_MODEL_NAME,
                        embeddingUpdatedAt: new Date(),
                    },
                }
            );

            successCount += 1;
            console.log(
                `[OK] Embedded product ${productId} (${successCount}/${products.length})`
            );
        } catch (error) {
            failedCount += 1;
            console.error(`[FAILED] Product ${productId}:`, error);
        }

        await sleep(REQUEST_DELAY_MS);
    }

    console.log(`Done. Success: ${successCount}, Failed: ${failedCount}`);
}

void (async () => {
    try {
        await embedAllProducts();
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Embedding job failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
})();
