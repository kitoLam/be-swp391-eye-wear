import { Router } from 'express';
import { validateBody } from '../../middlewares/share/validator.middleware';
import { authenticateMiddlewareClient } from '../../middlewares/client/auth.middleware';
import cartController from '../../controllers/client/cart.controller';
import { AddToCartSchema, UpdateCartItemSchema } from '../../types/cart/cart';

const router = Router();

// All cart routes require authentication
router.use(authenticateMiddlewareClient);

// Get cart
router.get('/', cartController.getCart);

// Add to cart
router.post('/add', validateBody(AddToCartSchema), cartController.addToCart);

// Update cart item quantity
router.patch(
    '/update',
    validateBody(UpdateCartItemSchema),
    cartController.updateCartItem
);

// Remove item from cart
router.delete('/remove/:product_id', cartController.removeFromCart);

// Clear cart
router.delete('/clear', cartController.clearCart);

export default router;
