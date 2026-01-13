import {
    ProductModel,
    IProductDocument,
} from '../../models/product/product.model.mongo';
import { BaseRepository } from '../base.repository';

export class ProductRepository extends BaseRepository<IProductDocument> {
    constructor() {
        super(ProductModel);
    }
    /**
     *
     * @param searchTerm
     * @param options is a object have page and limit
     * @returns
     */
    async searchByName(searchTerm: string, options = {}) {
        const page = (options as any).page || 1;
        const limit = (options as any).limit || 10;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            ProductModel.find({
                nameBase: { $regex: searchTerm, $options: 'i' },
                deletedAt: null,
            })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            ProductModel.countDocuments({
                nameBase: { $regex: searchTerm, $options: 'i' },
                deletedAt: null,
            }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getStatistics(): Promise<{
        total: number;
        byType: { type: string; count: number }[];
        byBrand: { brand: string; count: number }[];
    }> {
        const total = await this.count();
        const byType = await ProductModel.aggregate([
            { $match: { deletedAt: null } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $project: { type: '$_id', count: 1, _id: 0 } },
        ]);
        const byBrand = await ProductModel.aggregate([
            { $match: { deletedAt: null, brand: { $ne: null } } },
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $project: { brand: '$_id', count: 1, _id: 0 } },
        ]);

        return { total, byType, byBrand };
    }

    /**
     * sample data for this function
     * {
  total: 12,  // Tổng số sản phẩm
  
  byType: [
    { type: "frame", count: 7 },  // 7 gọng kính
    { type: "lens", count: 5 }    // 5 tròng kính
  ],
  
  byBrand: [
    { brand: "Ray-Ban", count: 3 },   // 3 sản phẩm Ray-Ban
    { brand: "Oakley", count: 2 },    // 2 sản phẩm Oakley
    { brand: "Gucci", count: 2 },     // 2 sản phẩm Gucci
    { brand: "Essilor", count: 2 },   // 2 sản phẩm Essilor
    { brand: "Zeiss", count: 1 }      // 1 sản phẩm Zeiss

  ]
}

     */
}

export const productRepository = new ProductRepository();
