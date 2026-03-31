import cartService from '../../services/client/cart.service';
import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { AddItemToCart, UpdateCartItemPrescription, UpdateCartItemQuantity } from '../../types/cart/cart.request';
class CartController {
    /**
     * Get customer's cart
     */
    getCart = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const cart = await cartService.getCart(customerId);
        res.json(
            ApiResponse.success('Get cart successfully!', {
                cart,
            })
        );
    };

    /**
     * Add product to cart
     */
    addToCart = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const payload = req.body as AddItemToCart;
        await cartService.addToCart(customerId, payload);
        res.json(
            ApiResponse.success('Added product to cart successfully!', null)
        );
    };

    /**
     * Update cart item quantity
     */
    updateCartItemQuantity = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const payload = req.body as UpdateCartItemQuantity;
        await cartService.updateCartItemQuantity(customerId, payload);
        res.json(
            ApiResponse.success('Updated quantity successfully!', null)
        );
    };
    /**
     * Update prescription for manufacturing item
     * @param req 
     * @param res 
     */
    updateCartItemPrescription = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const payload = req.body as UpdateCartItemPrescription;
        await cartService.updateCartItemPrescription(customerId, payload);
        res.json(
            ApiResponse.success('Updated prescription successfully!', null)
        );
    };

    /**
     * Remove product from cart
     */
    removeFromCart = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        await cartService.removeFromCart(customerId, req.body);
        res.json(
            ApiResponse.success('Removed product from cart successfully!', null)
        );
    };

    /**
     * Clear cart
     */
    clearCart = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        await cartService.clearCart(customerId);
        res.json(
            ApiResponse.success('Cleared cart successfully!', null)
        );
    };
}

export default new CartController();
