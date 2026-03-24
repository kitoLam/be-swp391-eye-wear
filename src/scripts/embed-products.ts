import mongoose from 'mongoose';
import { connectMongoDB } from '../config/database/mongodb.config';
import { embeddingModel } from '../config/google-gemini-ai.config';
import { ProductModel } from '../models/product/product.model.mongo';

type PlainObject = Record<string, unknown>;

const EMBEDDING_MODEL_FIXED_NAME = 'gemini-embedding-001';
const REQUEST_DELAY_MS = 400;
const MAX_RETRIES = 4;
const ONLY_MISSING_EMBEDDING = process.env.ONLY_MISSING_EMBEDDING !== 'false';
const BULK_WRITE_BATCH_SIZE = 20;

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
    const status = (error as { status?: number })?.status;
    return status === 429 || status === 503 || status === 502;
}

function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatCurrencyVND(value: number | null): string {
    if (value === null) return 'không rõ giá';
    return `${value.toLocaleString('vi-VN')} VND`;
}

function normalizeStockStatus(mode: string, stock: number | null): string {
    const upperMode = mode.toUpperCase();
    if (upperMode === 'OUT_OF_STOCK' || (stock !== null && stock <= 0)) {
        return 'Hết hàng';
    }
    if (upperMode === 'AVAILABLE' || (stock !== null && stock > 0)) {
        return 'Đang còn hàng';
    }
    return mode || 'Không rõ trạng thái';
}

function getFaceFitByShape(shape: string): string {
    const normalized = shape.toLowerCase();

    if (normalized.includes('butterfly') || normalized.includes('cat')) {
        return 'phù hợp mặt oval, square, heart';
    }
    if (normalized.includes('round')) {
        return 'phù hợp mặt square, rectangle';
    }
    if (normalized.includes('square')) {
        return 'phù hợp mặt round, oval';
    }
    if (normalized.includes('aviator')) {
        return 'phù hợp mặt oval, triangle, square';
    }

    return 'phù hợp nhiều dáng mặt';
}

function getDefaultVariant(product: PlainObject): PlainObject | null {
    const variants = Array.isArray(product.variants)
        ? (product.variants as PlainObject[])
        : [];

    if (variants.length === 0) return null;

    const foundDefault = variants.find(variant => variant.isDefault === true);
    return foundDefault ?? variants[0] ?? null;
}

function buildEmbeddingText(product: unknown): string {
    const p =
        product && typeof product === 'object'
            ? (product as PlainObject)
            : ({} as PlainObject);

    const brand = asString(p.brand, 'không rõ thương hiệu');
    const type = asString(p.type, 'không rõ loại');
    const nameBase = asString(p.nameBase, 'Sản phẩm');
    const skuBase = asString(p.skuBase, 'không rõ skuBase');

    const spec =
        p.spec && typeof p.spec === 'object' ? (p.spec as PlainObject) : {};

    const shape = asString(spec.shape, 'không rõ dáng');
    const faceFit = getFaceFitByShape(shape);

    const material = Array.isArray(spec.material)
        ? (spec.material as unknown[])
              .map(item => String(item))
              .filter(Boolean)
              .join(', ')
        : asString(spec.material, 'không rõ chất liệu');

    const dimensions =
        spec.dimensions && typeof spec.dimensions === 'object'
            ? (spec.dimensions as PlainObject)
            : {};

    const width = asNumber(dimensions.width);
    const height = asNumber(dimensions.height);
    const depth = asNumber(dimensions.depth);

    const variant = getDefaultVariant(p) ?? {};

    const sku = asString(variant.sku, skuBase);
    const variantName = asString(variant.name, nameBase);
    const mode = asString(variant.mode, 'không rõ trạng thái');
    const stock = asNumber(variant.stock);
    const finalPrice = asNumber(variant.finalPrice);
    const status = normalizeStockStatus(mode, stock);

    const options = Array.isArray(variant.options)
        ? (variant.options as PlainObject[])
        : [];

    const colorOption = options.find(option =>
        asString(option.attributeName).toLowerCase().includes('color')
    );

    const colorName = asString(colorOption?.label, 'không rõ màu');

    return [
        `${brand} ${type} ${nameBase}`,
        `sku ${sku} ${variantName}`,
        `shape ${shape} ${faceFit}`,
        `material ${material}`,
        `size ${width ?? '?'}-${height ?? '?'}-${depth ?? '?'} mm`,
        `color ${colorName}`,
        `stock ${status}`,
        `price ${formatCurrencyVND(finalPrice)}`,
    ].join('. ');
}

async function getEmbeddingVector(text: string): Promise<number[]> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await embeddingModel.embedContent(text);
            const values = (result as { embedding?: { values?: unknown } })
                ?.embedding?.values;

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

async function flushBulkUpdates(ops: any[]): Promise<void> {
    if (!ops.length) return;
    await ProductModel.bulkWrite(ops, { ordered: false });
    ops.length = 0;
}

async function embedAllProducts(): Promise<void> {
    await connectMongoDB();

    const query = ONLY_MISSING_EMBEDDING
        ? {
              deletedAt: null,
              $or: [
                  { embedding: { $exists: false } },
                  { embedding: null },
                  { embedding: { $size: 0 } },
              ],
          }
        : { deletedAt: null };

    const products = await ProductModel.find(query)
        .select({
            _id: 1,
            nameBase: 1,
            skuBase: 1,
            type: 1,
            brand: 1,
            spec: 1,
            variants: 1,
        })
        .lean();

    console.log(
        `Found ${products.length} products to embed. onlyMissing=${ONLY_MISSING_EMBEDDING}`
    );

    let successCount = 0;
    let failedCount = 0;
    const bulkOps: any[] = [];

    for (const product of products) {
        const productId = product._id.toString();

        try {
            const text = buildEmbeddingText(product);
            const vector = await getEmbeddingVector(text);

            bulkOps.push({
                updateOne: {
                    filter: { _id: product._id },
                    update: {
                        $set: {
                            embedding: vector,
                            embeddingModel: EMBEDDING_MODEL_FIXED_NAME,
                            embeddingUpdatedAt: new Date(),
                        },
                    },
                },
            });

            if (bulkOps.length >= BULK_WRITE_BATCH_SIZE) {
                await flushBulkUpdates(bulkOps);
            }

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

    await flushBulkUpdates(bulkOps);

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
