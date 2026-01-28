import { Router } from 'express';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import cartController from '../../controllers/client/cart.controller';
import { AddItemToCartSchema, RemoveCartItemSchema, UpdateCartItemPrescriptionSchema, UpdateCartItemQuantitySchema } from '../../types/cart/cart.request';

const router = Router();

// All cart routes require authentication
router.use(authenticateMiddlewareClient);

// Get cart
router.get('/', cartController.getCart);

// Add to cart
router.post('/add-product', validateBody(AddItemToCartSchema), cartController.addToCart);

// Update cart item quantity
router.patch(
    '/update-quantity',
    validateBody(UpdateCartItemQuantitySchema),
    cartController.updateCartItemQuantity
);
// Update cart item prescription
router.patch(
    '/update-prescription',
    validateBody(UpdateCartItemPrescriptionSchema),
    cartController.updateCartItemPrescription
);

// Remove item from cart
router.delete('/remove-product', validateBody(RemoveCartItemSchema), cartController.removeFromCart);

// Clear cart
router.delete('/clear', cartController.clearCart);

export default router;
