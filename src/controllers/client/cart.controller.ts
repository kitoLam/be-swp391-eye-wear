import cartService from '../../services/client/cart.service';
import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { AddToCart, UpdateCartItem } from '../../types/cart/cart';

class CartController {
    /**
     * Get customer's cart
     */
    getCart = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const cart = await cartService.getCart(customerId);
        res.json(
            ApiResponse.success('Lấy giỏ hàng thành công!', {
                cart,
            })
        );
    };

    /**
     * Add product to cart
     */
    addToCart = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const payload = req.body as AddToCart;
        const cart = await cartService.addToCart(customerId, payload);
        res.json(
            ApiResponse.success('Thêm sản phẩm vào giỏ hàng thành công!', {
                cart,
            })
        );
    };

    /**
     * Update cart item quantity
     */
    updateCartItem = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const payload = req.body as UpdateCartItem;
        const cart = await cartService.updateCartItem(customerId, payload);
        res.json(
            ApiResponse.success('Cập nhật số lượng thành công!', {
                cart,
            })
        );
    };

    /**
     * Remove product from cart
     */
    removeFromCart = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const productId = req.params.product_id as string;
        const cart = await cartService.removeFromCart(customerId, productId);
        res.json(
            ApiResponse.success('Xóa sản phẩm khỏi giỏ hàng thành công!', {
                cart,
            })
        );
    };

    /**
     * Clear cart
     */
    clearCart = async (req: Request, res: Response) => {
        const customerId = req.customer!.id;
        const cart = await cartService.clearCart(customerId);
        res.json(
            ApiResponse.success('Xóa toàn bộ giỏ hàng thành công!', {
                cart,
            })
        );
    };
}

export default new CartController();
