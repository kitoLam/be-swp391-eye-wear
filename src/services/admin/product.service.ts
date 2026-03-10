import { Types } from 'mongoose';
import { productRepository } from '../../repositories/product/product.repository';
import {
    ProductCreateDTO,
    ProductUpdateDTO,
} from '../../types/product/product/product.dto';
import { AuthAdminContext } from '../../types/context/context';
import { NotFoundRequestError, BadRequestError } from '../../errors/apiError/api-error';
import * as productConverter from '../../converters/admin/product.converter';
import { ProductListQuery } from '../../types/product/product/product.query';
import { slugify, generateUniqueSlug } from '../../utils/slug.util';
import { generateSkuBase, generateVariantSku } from '../../utils/sku.util';

import { ProductVariantMode } from '../../config/enums/product.enum';

class ProductService {
    /**
     * Validate variants options
     * - Each variant must have at least 1 option
     * - All variants must have the same set of attributeIds in their options
     */
    private validateVariantsOptions = (variants: any[]) => {
        if (!variants || variants.length === 0) {
            throw new BadRequestError('Product must have at least one variant');
        }

        // Get attributeIds set from first variant
        let referenceAttributeIds: Set<string> | null = null;

        for (const variant of variants) {
            // Check if variant has options
            if (!variant.options || variant.options.length === 0) {
                throw new BadRequestError('Each variant must have at least one option');
            }

            // Collect attributeIds from current variant's options
            const currentAttributeIds = new Set<string>();
            for (const option of variant.options) {
                if (!option.attributeId) {
                    throw new BadRequestError('Each option must have an attributeId');
                }
                currentAttributeIds.add(option.attributeId.toString());
            }

            // Set reference for first variant
            if (referenceAttributeIds === null) {
                referenceAttributeIds = currentAttributeIds;
            } else {
                // Compare current variant's attributeIds with reference
                if (referenceAttributeIds.size !== currentAttributeIds.size) {
                    throw new BadRequestError('All variants must have the same set of attributeIds in their options');
                }

                // Check if all attributeIds match
                for (const attrId of currentAttributeIds) {
                    if (!referenceAttributeIds.has(attrId)) {
                        throw new BadRequestError('All variants must have the same set of attributeIds in their options');
                    }
                }
            }
        }
    };
    /**
     * Tạo mới sản phẩm
     * @param payload - form data yêu cầu tạo từ user
     * @param context - thông tin admin đã login
     * @param defaultMode - chế độ mặc định cho các variant (AVAILABLE hoặc PRE_ORDER)
     * @returns
     */
    createProduct = async (
        payload: ProductCreateDTO,
        context: AuthAdminContext,
        defaultMode?: ProductVariantMode
    ) => {
        // 0. Validate variants options
        this.validateVariantsOptions(payload.variants);

        // 1. Generate slugBase with UUID
        const baseSlug = slugify(payload.nameBase);
        const uniqueSlug = generateUniqueSlug(baseSlug);

        // 2. Generate skuBase
        const skuBase = generateSkuBase(
            payload.type,
            payload.nameBase,
            uniqueSlug
        );

        // 3. Generate variant SKUs, names, and slugs
        const variantsWithGenerated = payload.variants.map(variant => {
            const variantSku = generateVariantSku(skuBase, variant.options);
            const variantName =
                variant.name ||
                `${payload.nameBase} - ${variant.options
                    .map(o => o.label)
                    .join(' - ')}`;
            const variantSlug = variant.slug || slugify(variantName);

            return {
                ...variant,
                sku: variantSku,
                name: variantName,
                slug: variantSlug,
                mode:
                    (variant as any).mode ||
                    defaultMode ||
                    ProductVariantMode.AVAILABLE,
            };
        });

        // 4. Create product with generated values
        await productRepository.create({
            ...payload,
            slugBase: uniqueSlug,
            skuBase: skuBase,
            variants: variantsWithGenerated,
            createdBy: new Types.ObjectId(context.id),
        } as any);

        // 5. Return variant SKUs
        return {
            variantSkus: variantsWithGenerated.map(v => v.sku),
        };
    };

    /**
     * Cập nhật sản phẩm
     * @param id - id sản phẩm
     * @param payload - thông tin cập nhật
     * @param context - thông tin admin đã login
     */
    updateProduct = async (
        id: string,
        payload: ProductUpdateDTO,
        context: AuthAdminContext
    ) => {
        const foundProduct = await productRepository.findOne({
            _id: id,
            deletedAt: null,
        });
        if (!foundProduct) throw new NotFoundRequestError('Product not found');

        // 0. Validate variants options if provided
        if (payload.variants) {
            this.validateVariantsOptions(payload.variants);
        }

        let updateData: any = {
            ...payload,
            updatedBy: new Types.ObjectId(context.id),
        };

        const type = payload.type || foundProduct.type;
        const nameBase = payload.nameBase || foundProduct.nameBase;

        let currentSkuBase = foundProduct.skuBase;
        let currentSlugBase = foundProduct.slugBase;

        // 1. If nameBase or type changed, regenerate slugBase and skuBase
        if (
            (payload.nameBase && payload.nameBase !== foundProduct.nameBase) ||
            (payload.type && payload.type !== foundProduct.type)
        ) {
            const baseSlug = slugify(nameBase);
            currentSlugBase = generateUniqueSlug(baseSlug);
            currentSkuBase = generateSkuBase(type, nameBase, currentSlugBase);

            updateData.slugBase = currentSlugBase;
            updateData.skuBase = currentSkuBase;
        }

        // 2. Handle variants
        if (payload.variants) {
            // If variants provided in payload, regenerate their info
            updateData.variants = payload.variants.map(variant => {
                const variantSku = generateVariantSku(
                    currentSkuBase,
                    variant.options
                );
                const variantName =
                    variant.name ||
                    `${nameBase} - ${variant.options
                        .map(o => o.label)
                        .join(' - ')}`;
                const variantSlug = variant.slug || slugify(variantName);

                return {
                    ...variant,
                    sku: variantSku,
                    name: variantName,
                    slug: variantSlug,
                };
            });
        } else if (
            payload.nameBase &&
            payload.nameBase !== foundProduct.nameBase
        ) {
            // If nameBase changed but variants were NOT provided, update existing variants
            updateData.variants = foundProduct.variants.map(variant => {
                const variantSku = generateVariantSku(
                    currentSkuBase,
                    variant.options
                );
                const variantName = `${nameBase} - ${variant.options
                    .map(o => o.label)
                    .join(' - ')}`;
                const variantSlug = slugify(variantName);

                return {
                    ...(variant as any).toObject(),
                    sku: variantSku,
                    name: variantName,
                    slug: variantSlug,
                };
            });
        }

        await productRepository.update(id, updateData);
    };

    /**
     * Xóa sản phẩm theo id (soft delete)
     * @param id - id sản phẩm
     * @param context - thông tin admin đã login
     */
    deleteProduct = async (id: string, context: AuthAdminContext) => {
        const foundProduct = await productRepository.findOne({
            _id: id,
            deletedAt: null,
        });
        if (!foundProduct) throw new NotFoundRequestError('Product not found');

        await productRepository.update(id, {
            deletedAt: new Date(),
            deletedBy: new Types.ObjectId(context.id),
        } as any);
    };

    /**
     * Lấy chi tiết sản phẩm theo id
     * @param id - id sản phẩm
     * @returns Product detail
     */
    getProductDetail = async (id: string) => {
        const foundProduct = await productRepository.findOne({
            _id: id,
        });
        if (!foundProduct) {
            throw new NotFoundRequestError('Product not found');
        }
        return productConverter.toProductCreateDTO(foundProduct);
    };

    /**
     * Lấy danh sách sản phẩm với phân trang và filter
     * @param query - query parameters (page, limit, type, brand, search)
     * @returns Danh sách sản phẩm và thông tin phân trang
     */
    getProductList = async (query: ProductListQuery) => {
        console.log(query)
        // Xây dựng filter
        const filter: any = {};

        if (query.type) {
            filter.type = query.type;
        }

        if (query.brand) {
            filter.brand = {$in: query.brand}
        }
        
        if (query.search) {
            filter.nameBase = { $regex: query.search, $options: 'i' };
        }

        // Spec filters for frame/sunglass
        if (query.material) {
            filter['spec.material'] = {$in: query.material};
        }
        if (query.shape) {
            filter['spec.shape'] = {$in: query.shape};
        }
        if (query.gender) {
            filter['spec.gender'] = {$in: query.gender};
        }
        if (query.style) {
            filter['spec.style'] = {$in: query.style};
        }

        // Spec filters for lens
        if (query.feature) {
            filter['spec.feature'] = {$in: query.feature};
        }
        if (query.origin) {
            filter['spec.origin'] = query.origin;
        }

        // General filters
        if (query.category) {
            filter.categories = query.category;
        }
        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            filter['variants.finalPrice'] = {} as any;
            if (query.minPrice !== undefined) {
                filter['variants.finalPrice'].$gte = query.minPrice;
            }
            if (query.maxPrice !== undefined) {
                filter['variants.finalPrice'].$lte = query.maxPrice;
            }
        }

        const paginationResult = await productRepository.find(filter, {
            page: query.page,
            limit: query.limit,
        });

        const productList = paginationResult.data;
        const pagination = {
            page: paginationResult.page,
            limit: paginationResult.limit,
            total: paginationResult.total,
            totalPages: paginationResult.totalPages,
        };

        return {
            productList: productList.map(item =>
                productConverter.toStandardProduct(item)
            ),
            pagination,
        };
    };

    /**
     * Tìm kiếm sản phẩm theo tên
     * @param searchTerm - từ khóa tìm kiếm
     * @param query - query parameters (page, limit)
     * @returns Danh sách sản phẩm tìm được và thông tin phân trang
     */
    searchProducts = async (
        searchTerm: string,
        query: { page?: number; limit?: number }
    ) => {
        const paginationResult = await productRepository.searchByName(
            searchTerm,
            {
                page: query.page || 1,
                limit: query.limit || 10,
            }
        );

        const productList = paginationResult.data;
        const pagination = {
            page: paginationResult.page,
            limit: paginationResult.limit,
            total: paginationResult.total,
            totalPages: paginationResult.totalPages,
        };

        return {
            productList: productList.map(item =>
                productConverter.toStandardProduct(item)
            ),
            pagination,
        };
    };

    /**
     * Lấy thống kê sản phẩm
     * @returns Thống kê tổng số, theo loại và theo thương hiệu
     */
    getProductStatistics = async () => {
        return await productRepository.getStatistics();
    };

    /**
     * Tìm kiếm sản phẩm theo tên hoặc slug
     * @param searchTerm - từ khóa tìm kiếm
     * @param query - query parameters (page, limit)
     * @returns Danh sách sản phẩm tìm được và thông tin phân trang
     */
    searchByNameSlug = async (
        searchTerm: string,
        query: { page?: number; limit?: number }
    ) => {
        const filter: any = {
            $or: [
                { nameBase: { $regex: searchTerm, $options: 'i' } },
                { slugBase: { $regex: searchTerm, $options: 'i' } },
            ],
        };

        const paginationResult = await productRepository.find(filter, {
            page: query.page || 1,
            limit: query.limit || 10,
        });

        const productList = paginationResult.data;
        const pagination = {
            page: paginationResult.page,
            limit: paginationResult.limit,
            total: paginationResult.total,
            totalPages: paginationResult.totalPages,
        };

        return {
            productList: productList.map(item =>
                productConverter.toStandardProduct(item)
            ),
            pagination,
        };
    };

    /**
     * Tìm kiếm sản phẩm theo SKU
     * @param sku - mã SKU cần tìm
     * @returns Sản phẩm tìm được hoặc null
     */
    searchBySku = async (sku: string) => {
        const foundProduct = await productRepository.findOne({
            skuBase: sku,
        });

        if (!foundProduct) {
            throw new NotFoundRequestError(
                'Product not found with SKU: ' + sku
            );
        }

        return productConverter.toProductCreateDTO(foundProduct);
    };
    getSpecificProductVariant = async (id: string, sku: string) => {
        const product = await productRepository.findOne({
            _id: id,
        });
        if (!product) {
            throw new NotFoundRequestError('Product not found');
        }
        const variant = product.variants.find(v => v.sku == sku);
        if (!variant) {
            throw new NotFoundRequestError('Variant not found');
        }
        return {
            productDetail: product,
            variantDetail: variant,
        };
    };

    /**
     * Lấy tất cả giá trị spec distinct hiện có trong DB
     * Dùng cho filter UI
     */
    getProductSpecs = async () => {
        return await productRepository.getDistinctSpecs();
    };
}

export default new ProductService();
