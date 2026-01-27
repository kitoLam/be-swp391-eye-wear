import { Request, Response } from "express";
import checkoutService from "../../services/client/checkout.service";
import { ApiResponse } from "../../utils/api-response";

class CheckoutController {
  createCheckoutSession = async (req: Request, res: Response) => {
    const checkoutSessionId = await checkoutService.createCheckoutSession(req.customer!, req.body);
    res.json(ApiResponse.success('Tạo checkout session thành công', { checkoutSessionId }));
  }
  getProductListInCheckoutSession = async (req: Request, res: Response) => {
    const products = await checkoutService.getProductListFromCheckout(req.customer!, req.params.id as string);
    res.json(ApiResponse.success('Lay danh sach san pham trong checkout session thanh cong', { products }));
  }
}

export default new CheckoutController();