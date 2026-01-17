import productService from '../../services/admin/product.service';
import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { ProductMessage } from '../../config/constants/response-messages/product.constant';
import { ProductListQuery } from '../../types/product/product/product.query';

class ProductController {
    /**
     * Public: Get product list
     */
    getProductList = async (req: Request, res: Response) => {
        const query = req.validatedQuery as ProductListQuery;
        const data = await productService.getProductList(query);
        res.json(ApiResponse.success(ProductMessage.success.getList, data));
    };

    /**
     * Public: Get product detail
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
}

export default new ProductController();
