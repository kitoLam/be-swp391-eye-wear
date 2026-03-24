import { IProductDocument } from '../../models/product/product.model.mongo';
import { ProductCreateDTO } from '../../types/product/product/product.dto';
import { StandardProduct } from '../../types/product/product/product.response';
import { formatDateToString } from '../../utils/formatter';

/**
 * Chuyển đổi Product document sang ProductCreateDTO
 * @param data - Product document từ database
 * @returns ProductCreateDTO
 */
export const toProductCreateDTO = (
    data: IProductDocument
): ProductCreateDTO => {
    const baseProduct = {
        nameBase: data.nameBase,
        slugBase: data.slugBase,
        skuBase: data.skuBase,
        brand: data.brand,
        categories: data.categories,
        variants: data.variants.map(variant => ({
            mode: variant.mode,
            sku: variant.sku,
            name: variant.name,
            slug: variant.slug,
            options: variant.options.map(option => ({
                attributeId: option.attributeId,
                attributeName: option.attributeName,
                label: option.label,
                showType: option.showType,
                value: option.value,
            })),
            price: variant.price,
            finalPrice: variant.finalPrice,
            stock: variant.stock,
            imgs: variant.imgs,
            virTryOnUrl: variant.virTryOnUrl,
            isDefault: variant.isDefault,
        })),
    };

    if (data.type === 'frame' || data.type === 'sunglass') {
        return {
            ...baseProduct,
            type: data.type as 'frame' | 'sunglass',
            spec: data.spec,
        };
    } else {
        return {
            ...baseProduct,
            type: 'lens' as const,
            spec: data.spec,
        };
    }
};

/**
 * Chuyển đổi Product document sang StandardProduct (cho danh sách)
 * @param data - Product document từ database
 * @returns StandardProduct
 */
export const toStandardProduct = (data: IProductDocument): StandardProduct => {
    // Tìm variant mặc định hoặc variant đầu tiên
    const defaultVariant =
        data.variants.find(v => v.isDefault) || data.variants[0];

    return {
        id: data._id.toString(),
        nameBase: data.nameBase,
        slugBase: data.slugBase,
        skuBase: data.skuBase,
        type: data.type,
        brand: data.brand,
        categories: data.categories,
        defaultVariantPrice: defaultVariant?.price,
        defaultVariantFinalPrice: defaultVariant?.finalPrice,
        defaultVariantImage: defaultVariant?.imgs?.[0],
        totalVariants: data.variants.length,
        createdAt: formatDateToString(data.createdAt || new Date()),
    };
};
