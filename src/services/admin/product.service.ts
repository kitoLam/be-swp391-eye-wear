import { Types } from 'mongoose';
import {
    ProductRepository,
    productRepository,
} from '../../repositories/product/product.repository';
import {
    ProductCreateDTO,
    ProductUpdateDTO,
} from '../../types/product/product/product.dto';
import { AuthAdminContext } from '../../types/context/context';
import { NotFoundRequestError } from '../../errors/apiError/api-error';
import * as productConverter from '../../converters/admin/product.converter';
import { ProductListQuery } from '../../types/product/product/product.query';

class ProductService {
    /**
     * Tạo mới sản phẩm
     * @param payload - form data yêu cầu tạo từ user
     * @param context - thông tin admin đã login
     * @returns
     */
    createProduct = async (
        payload: ProductCreateDTO,
        context: AuthAdminContext
    ) => {
        await productRepository.create({
            ...payload,
            createdBy: new Types.ObjectId(context.id),
        } as any);
    };

    /**
     * Cập nhật sản phẩm
     * @param id - id sản phẩm
     * @param payload - thông tin cập nhật
     */
    updateProduct = async (id: string, payload: ProductUpdateDTO) => {
        const foundProduct = await productRepository.findOne({
            _id: id,
        });
        if (!foundProduct) throw new NotFoundRequestError('Product not found');

        await productRepository.update(id, {
            ...payload,
        } as any);
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
        // Xây dựng filter
        const filter: any = {};

        if (query.type) {
            filter.type = query.type;
        }

        if (query.brand) {
            filter.brand = query.brand;
        }

        if (query.search) {
            filter.nameBase = { $regex: query.search, $options: 'i' };
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
}

export default new ProductService();
