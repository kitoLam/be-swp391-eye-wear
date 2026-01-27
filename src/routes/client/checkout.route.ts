import { Router } from "express";
import { authenticateMiddlewareClient } from "../../middlewares/client/auth.middleware";
import { validateBody } from "../../middlewares/share/validator.middleware";
import { CheckoutSessionCreateSchema } from "../../types/checkout/checkout.request";
import checkoutController from "../../controllers/client/checkout.controller";

const router = Router();
router.use(authenticateMiddlewareClient)
router.get('/sessions/:id', checkoutController.getProductListInCheckoutSession);

router.post('/sessions',validateBody(CheckoutSessionCreateSchema), checkoutController.createCheckoutSession);

export default router;