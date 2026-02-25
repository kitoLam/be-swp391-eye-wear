import mongoose from 'mongoose';
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

    /**
     * Lấy tất cả giá trị distinct cho các spec fields
     * Dùng cho filter UI (dropdown / checkbox)
     */
    async getDistinctSpecs(): Promise<{
        materials: string[];
        shapes: string[];
        genders: string[];
        styles: string[];
        features: string[];
        origins: string[];
        brands: string[];
        categories: { _id: string; name: string }[];
        types: string[];
    }> {
        const result = await ProductModel.aggregate([
            { $match: { deletedAt: null } },
            {
                $facet: {
                    materials: [
                        {
                            $match: {
                                'spec.material': { $exists: true, $ne: null },
                            },
                        },
                        { $unwind: '$spec.material' },
                        { $group: { _id: '$spec.material' } },
                        { $sort: { _id: 1 } },
                    ],
                    shapes: [
                        {
                            $match: {
                                'spec.shape': { $exists: true, $ne: null },
                            },
                        },
                        { $group: { _id: '$spec.shape' } },
                        { $sort: { _id: 1 } },
                    ],
                    genders: [
                        {
                            $match: {
                                'spec.gender': { $exists: true, $ne: null },
                            },
                        },
                        { $group: { _id: '$spec.gender' } },
                        { $sort: { _id: 1 } },
                    ],
                    styles: [
                        {
                            $match: {
                                'spec.style': { $exists: true, $ne: null },
                            },
                        },
                        { $group: { _id: '$spec.style' } },
                        { $sort: { _id: 1 } },
                    ],
                    features: [
                        {
                            $match: {
                                'spec.feature': { $exists: true, $ne: null },
                            },
                        },
                        { $unwind: '$spec.feature' },
                        { $group: { _id: '$spec.feature' } },
                        { $sort: { _id: 1 } },
                    ],
                    origins: [
                        {
                            $match: {
                                'spec.origin': { $exists: true, $ne: null },
                            },
                        },
                        { $group: { _id: '$spec.origin' } },
                        { $sort: { _id: 1 } },
                    ],
                    brands: [
                        { $match: { brand: { $ne: null } } },
                        { $group: { _id: '$brand' } },
                        { $sort: { _id: 1 } },
                    ],
                    categories: [
                        { $unwind: '$categories' },
                        { $group: { _id: '$categories' } },
                        {
                            $addFields: {
                                categoryObjId: {
                                    $toObjectId: '$_id',
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: 'categories',
                                localField: 'categoryObjId',
                                foreignField: '_id',
                                as: 'categoryInfo',
                            },
                        },
                        { $unwind: '$categoryInfo' },
                        {
                            $project: {
                                _id: 1,
                                name: '$categoryInfo.name',
                            },
                        },
                        { $sort: { name: 1 } },
                    ],
                    types: [
                        { $group: { _id: '$type' } },
                        { $sort: { _id: 1 } },
                    ],
                },
            },
        ]);

        const facet = result[0];
        return {
            materials: facet.materials.map((m: any) => m._id as string),
            shapes: facet.shapes.map((s: any) => s._id as string),
            genders: facet.genders.map((g: any) => g._id as string),
            styles: facet.styles.map((s: any) => s._id as string),
            features: facet.features.map((f: any) => f._id as string),
            origins: facet.origins.map((o: any) => o._id as string),
            brands: facet.brands.map((b: any) => b._id as string),
            categories: facet.categories.map((c: any) => ({
                _id: c._id as string,
                name: c.name as string,
            })),
            types: facet.types.map((t: any) => t._id as string),
        };
    }
}

export const productRepository = new ProductRepository();
