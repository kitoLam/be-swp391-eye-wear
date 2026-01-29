import productService from '../../services/admin/product.service';
import clientProductService from '../../services/client/product.service';
import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { ProductMessage } from '../../config/constants/response-messages/product.constant';
import { ProductListQuery } from '../../types/product/product/product.query';
import { ProductConfigManufacturing } from '../../types/product/product/product.dto';

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
  
    // configProductManufacturing = async (req: Request, res: Response) => {
    //     const payload = req.body as ProductConfigManufacturing;
    //     const data = await clientProductService.configProductManufacturing(payload);
    //     res.json(ApiResponse.success("Get success", {
    //         productManufacturing: data,
    //     }));
    // }
}

export default new ProductController();
