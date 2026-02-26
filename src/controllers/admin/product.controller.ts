import productService from '../../services/admin/product.service';
import { Request, Response } from 'express';
import {
    ProductCreateDTO,
    ProductUpdateDTO,
} from '../../types/product/product/product.dto';
import { ApiResponse } from '../../utils/api-response';
import { ProductMessage } from '../../config/constants/response-messages/product.constant';
import { ProductListQuery } from '../../types/product/product/product.query';
import { ProductVariantMode } from '../../config/enums/product.enum';

class ProductController {
    /**
     * Tạo sản phẩm mới
     */
    createProduct = async (req: Request, res: Response) => {
        await productService.createProduct(
            req.body as ProductCreateDTO,
            req.adminAccount!
        );
        res.json(ApiResponse.success(ProductMessage.success.create, {}));
    };

    /**
     * Tạo sản phẩm mới - auto set tất cả variants mode = AVAILABLE
     */
    createProductAvailable = async (req: Request, res: Response) => {
        await productService.createProduct(
            req.body as ProductCreateDTO,
            req.adminAccount!,
            ProductVariantMode.AVAILABLE
        );
        res.json(ApiResponse.success(ProductMessage.success.create, {}));
    };

    /**
     * Tạo sản phẩm mới - auto set tất cả variants mode = PRE_ORDER
     */
    createProductPreOrder = async (req: Request, res: Response) => {
        await productService.createProduct(
            req.body as ProductCreateDTO,
            req.adminAccount!,
            ProductVariantMode.PRE_ORDER
        );
        res.json(ApiResponse.success(ProductMessage.success.create, {}));
    };

    /**
     * Cập nhật sản phẩm
     */
    updateProduct = async (req: Request, res: Response) => {
        const productId = req.params.id as string;
        await productService.updateProduct(
            productId,
            req.body as ProductUpdateDTO,
            req.adminAccount!
        );
        res.json(ApiResponse.success(ProductMessage.success.update, {}));
    };

    /**
     * Xóa sản phẩm (soft delete)
     */
    deleteProduct = async (req: Request, res: Response) => {
        const productId = req.params.id as string;
        await productService.deleteProduct(productId, req.adminAccount!);
        res.json(ApiResponse.success(ProductMessage.success.delete, {}));
    };

    /**
     * Lấy chi tiết sản phẩm
     */
    getProductDetail = async (req: Request, res: Response) => {
        const productDetail = await productService.getProductDetail(
            req.params.id as string
        );
        res.json(
            ApiResponse.success(ProductMessage.success.getDetail, {
                product: productDetail,
            })
        );
    };

    /**
     * Lấy danh sách sản phẩm với phân trang và filter
     */
    getProductList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as ProductListQuery;
        const data = await productService.getProductList(query);
        res.json(ApiResponse.success(ProductMessage.success.getList, data));
    };

    /**
     * Tìm kiếm sản phẩm theo tên hoặc slug
     */
    searchByNameSlug = async (req: Request, res: Response) => {
        const searchTerm = req.query.search as string;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit
            ? parseInt(req.query.limit as string)
            : 10;

        const data = await productService.searchByNameSlug(searchTerm, {
            page,
            limit,
        });
        res.json(ApiResponse.success(ProductMessage.success.search, data));
    };

    /**
     * Tìm kiếm sản phẩm theo SKU
     */
    searchBySku = async (req: Request, res: Response) => {
        const sku = req.params.sku as string;
        const product = await productService.searchBySku(sku);
        res.json(
            ApiResponse.success(ProductMessage.success.search, {
                product,
            })
        );
    };

    /**
     * Lấy thống kê sản phẩm
     */
    getProductStatistics = async (req: Request, res: Response) => {
        const statistics = await productService.getProductStatistics();
        res.json(
            ApiResponse.success(ProductMessage.success.getList, {
                statistics,
            })
        );
    };
}

export default new ProductController();
