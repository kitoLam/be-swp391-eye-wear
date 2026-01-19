import { cartRepository } from '../../repositories/cart/cart.repository';
import { NotFoundRequestError } from '../../errors/apiError/api-error';
import { AddToCart, UpdateCartItem } from '../../types/cart/cart';

class CartService {
    /**
     * Get cart by customer ID
     * @param customerId - Customer ID from auth token
     * @returns Cart document
     */
    getCart = async (customerId: string) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Giỏ hàng không tồn tại!');
        }

        return cart;
    };

    /**
     * Add product to cart
     * @param customerId - Customer ID from auth token
     * @param payload - Product ID and quantity
     * @returns Updated cart
     */
    addToCart = async (customerId: string, payload: AddToCart) => {
        // Find or create cart
        let cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            // Create new cart if doesn't exist
            cart = await cartRepository.create({
                owner: customerId,
                products: [],
                totalProduct: 0,
            } as any);
        }

        // Add product using repository method
        const updatedCart = await cartRepository.addProduct(
            customerId,
            payload.product_id,
            payload.quantity
        );

        if (!updatedCart) {
            throw new NotFoundRequestError(
                'Không thể thêm sản phẩm vào giỏ hàng!'
            );
        }

        return updatedCart;
    };

    /**
     * Update product quantity in cart
     * @param customerId - Customer ID from auth token
     * @param payload - Product ID and new quantity
     * @returns Updated cart
     */
    updateCartItem = async (customerId: string, payload: UpdateCartItem) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Giỏ hàng không tồn tại!');
        }

        // Check if product exists in cart
        const productExists = cart.products.some(
            p => p.product_id === payload.product_id
        );

        if (!productExists) {
            throw new NotFoundRequestError('Sản phẩm không có trong giỏ hàng!');
        }

        // Update quantity
        const updatedCart = await cartRepository.updateProductQuantity(
            customerId,
            payload.product_id,
            payload.quantity
        );

        if (!updatedCart) {
            throw new NotFoundRequestError('Không thể cập nhật số lượng!');
        }

        return updatedCart;
    };

    /**
     * Remove product from cart
     * @param customerId - Customer ID from auth token
     * @param productId - Product ID (SKU) to remove
     * @returns Updated cart
     */
    removeFromCart = async (customerId: string, productId: string) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Giỏ hàng không tồn tại!');
        }

        // Check if product exists in cart
        const productExists = cart.products.some(
            p => p.product_id === productId
        );

        if (!productExists) {
            throw new NotFoundRequestError('Sản phẩm không có trong giỏ hàng!');
        }

        // Remove product
        const updatedCart = await cartRepository.removeProduct(
            customerId,
            productId
        );

        if (!updatedCart) {
            throw new NotFoundRequestError('Không thể xóa sản phẩm!');
        }

        return updatedCart;
    };

    /**
     * Clear all products from cart
     * @param customerId - Customer ID from auth token
     * @returns Updated cart
     */
    clearCart = async (customerId: string) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Giỏ hàng không tồn tại!');
        }

        // Clear cart
        const updatedCart = await cartRepository.clearCart(customerId);

        if (!updatedCart) {
            throw new NotFoundRequestError('Không thể xóa giỏ hàng!');
        }

        return updatedCart;
    };
}

export default new CartService();
