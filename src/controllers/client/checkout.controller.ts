import { Request, Response } from "express";
import checkoutService from "../../services/client/checkout.service";
import { ApiResponse } from "../../utils/api-response";

class CheckoutController {
  createCheckoutSession = async (req: Request, res: Response) => {
    const checkoutSessionId = await checkoutService.createCheckoutSession(req.customer!, req.body);
    res.json(ApiResponse.success('Checkout session created successfully', { checkoutSessionId }));
  }
  getProductListInCheckoutSession = async (req: Request, res: Response) => {
    const products = await checkoutService.getProductListFromCheckout(req.customer!, req.params.id as string);
    res.json(ApiResponse.success('Get product list in checkout session successfully', { products }));
  }
}

export default new CheckoutController();