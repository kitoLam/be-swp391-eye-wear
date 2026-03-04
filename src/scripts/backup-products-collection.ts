import mongoose from 'mongoose';
import { connectMongoDB } from '../config/database/mongodb.config';
import { ProductModel } from '../models/product/product.model.mongo';

function getBackupCollectionName(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    return `products_backup_before_embed_${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

async function backupProductsToCollection(): Promise<void> {
    await connectMongoDB();

    const sourceCollection = ProductModel.collection.name;
    const backupCollection = getBackupCollectionName();

    const sourceCount = await ProductModel.countDocuments({});

    await ProductModel.collection
        .aggregate([{ $match: {} }, { $out: backupCollection }])
        .toArray();

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('MongoDB connection is not ready');
    }

    const backupCount = await db
        .collection(backupCollection)
        .countDocuments({});

    console.log(`Backup completed.`);
    console.log(`Source collection: ${sourceCollection} (${sourceCount} documents)`);
    console.log(`Backup collection: ${backupCollection} (${backupCount} documents)`);
}

void (async () => {
    try {
        await backupProductsToCollection();
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Backup failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
})();

