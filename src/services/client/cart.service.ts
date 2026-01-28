import { cartRepository } from '../../repositories/cart/cart.repository';
import { NotFoundRequestError } from '../../errors/apiError/api-error';
import { AddItemToCart, RemoveCartItem, UpdateCartItemPrescription, UpdateCartItemQuantity } from '../../types/cart/cart.request';

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
        // =========== TODO: sau này a Thắng muốn check stock lúc thêm luôn thì check thêm ===========

        // =========== End sau này a Thắng muốn check stock luôn thì check thêm ===========

        if((await cartRepository.isExistItemInCart(customerId, payload.item)) == true) {
            // cập nhật số lượng thôi nếu nó xuất hiện rồi
            await cartRepository.increaseProductQuantity(customerId, payload.item, payload.quantity);
        }
        else {
            // push item mới vào
            await cartRepository.addProduct(customerId, payload.item, payload.quantity);
        }
    };
    /**
     * Update cart item quantity
     * @param customerId - Customer ID from auth token
     * @param payload - Item ID and new quantity
     * @throws NotFoundRequestError if cart or item does not exist
     */
    updateCartItemQuantity = async (customerId: string, payload: UpdateCartItemQuantity) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Giỏ hàng không tồn tại!');
        }

        // Check if product exists in cart
        const productExists = await cartRepository.isExistItemInCart(customerId, payload.item);

        if (!productExists) {
            throw new NotFoundRequestError('Sản phẩm không có trong giỏ hàng!');
        }
        // =========== TODO: sau này a Thắng muốn check stock lúc thêm luôn thì check thêm ===========

        // =========== End sau này a Thắng muốn check stock luôn thì check thêm ===========
        // Update quantity
        await cartRepository.updateProductQuantity(customerId, payload.item, payload.quantity);
    };

    updateCartItemPrescription = async (customerId: string, payload: UpdateCartItemPrescription) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Giỏ hàng không tồn tại!');
        }

        // Check if product exists in cart
        const productExists = await cartRepository.isExistItemInCart(customerId, payload.item);

        if (!productExists) {
            throw new NotFoundRequestError('Sản phẩm không có trong giỏ hàng!');
        }
        // Update prescription
        await cartRepository.updateProductPrescription(customerId, payload.item, payload.parameters);
    };

    
    removeFromCart = async (customerId: string, payload: RemoveCartItem) => {
        const cart = await cartRepository.findOne({
            owner: customerId,
            deletedAt: null,
        } as any);

        if (!cart) {
            throw new NotFoundRequestError('Giỏ hàng không tồn tại!');
        }

        // Check if product exists in cart
        const productExists = await cartRepository.isExistItemInCart(customerId, payload.item);

        if (!productExists) {
            throw new NotFoundRequestError('Sản phẩm không có trong giỏ hàng!');
        }

        // Remove product
        await cartRepository.removeProduct(
            customerId,
            payload.item
        );
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
