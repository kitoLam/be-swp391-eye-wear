import { cartRepository } from '../../repositories/cart/cart.repository';
import {
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import {
    AddItemToCart,
    RemoveCartItem,
    UpdateCartItemPrescription,
    UpdateCartItemQuantity,
} from '../../types/cart/cart.request';
import productService from './product.service';

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
            throw new NotFoundRequestError('Cart does not exist!');
        }

        return cart;
    };

    /**
     * Add item to cart
     * @param customerId - Customer ID from auth token
     * @param payload - Item details and quantity
     * @throws NotFoundRequestError if cart does not exist
     */
    addToCart = async (customerId: string, payload: AddItemToCart) => {
        // Find or create cart
        let cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        });

        if (!cart) {
            // Create new cart if doesn't exist
            await cartRepository.create({
                owner: customerId,
                products: [],
                totalProduct: 0,
            });
        }
        const curProductInCart = cart ? cart.products.find(item => {
            return (
                item.product.product_id == payload.item.product.product_id &&
                item.product.sku == payload.item.product.sku &&
                ((payload.item.lens && item.lens) ? (item.lens.lens_id == payload.item.lens.lens_id &&
                item.lens.sku == payload.item.lens.sku) : true)
            );
        }) : 0;
        // chắc chắn là product khách mua đang đúng định dạng mà ta quy định và còn hàng
        await productService.ensureBoughtProductIsValidToBuy(
            {
                productId: payload.item.product.product_id,
                productSku: payload.item.product.sku,
                buyAmount: payload.quantity + (curProductInCart ? curProductInCart.quantity : 0),
            },
            payload.item.lens
                ? {
                      lensId: payload.item.lens.lens_id,
                      lensSku: payload.item.lens.sku,
                      buyAmount: payload.quantity,
                  }
                : undefined
        );
        // chắc chắn là product khách mua đang đúng định dạng mà ta quy định và còn hàng

        if (
            (await cartRepository.isExistItemInCart(
                customerId,
                payload.item
            )) == true
        ) {
            // cập nhật số lượng thôi nếu nó xuất hiện rồi
            await cartRepository.increaseProductQuantity(
                customerId,
                payload.item,
                payload.quantity
            );
        } else {
            // push item mới vào
            await cartRepository.addProduct(
                customerId,
                payload.item,
                payload.quantity
            );
        }
    };
    /**
     * Update cart item quantity
     * @param customerId - Customer ID from auth token
     * @param payload - Item ID and new quantity
     * @throws NotFoundRequestError if cart or item does not exist
     */
    updateCartItemQuantity = async (
        customerId: string,
        payload: UpdateCartItemQuantity
    ) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Cart does not exist!');
        }

        await productService.ensureBoughtProductIsValidToBuy(
            {
                productId: payload.item.product.product_id,
                productSku: payload.item.product.sku,
                buyAmount: payload.quantity,
            },
            payload.item.lens
                ? {
                      lensId: payload.item.lens.lens_id,
                      lensSku: payload.item.lens.sku,
                      buyAmount: payload.quantity,
                  }
                : undefined
        );
        if (
            (await cartRepository.isExistItemInCart(
                customerId,
                payload.item
            )) == false
        ){
            throw new NotFoundRequestError('Product not found in cart!');
        }
        // Update quantity
        await cartRepository.updateProductQuantity(
            customerId,
            payload.item,
            payload.quantity
        );
    };

    updateCartItemPrescription = async (
        customerId: string,
        payload: UpdateCartItemPrescription
    ) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Cart does not exist!');
        }

        // Check if product exists in cart
        const productExists = await cartRepository.isExistItemInCart(
            customerId,
            payload.item
        );

        if (!productExists) {
            throw new NotFoundRequestError('Product not found in cart!');
        }
        // Update prescription
        await cartRepository.updateProductPrescription(
            customerId,
            payload.item,
            payload.parameters
        );
    };

    removeFromCart = async (customerId: string, payload: RemoveCartItem) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Cart does not exist!');
        }

        // Check if product exists in cart
        const productExists = await cartRepository.isExistItemInCart(
            customerId,
            payload.item
        );

        if (!productExists) {
            throw new NotFoundRequestError('Product not found in cart!');
        }

        // Remove product
        await cartRepository.removeProduct(customerId, payload.item);
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
            throw new NotFoundRequestError('Cart does not exist!');
        }

        // Clear cart
        const updatedCart = await cartRepository.clearCart(customerId);

        if (!updatedCart) {
            throw new NotFoundRequestError('Could not clear cart!');
        }

        return updatedCart;
    };
}

export default new CartService();
