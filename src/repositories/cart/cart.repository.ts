import { CartModel, ICartDocument } from '../../models/cart/cart.model.mongo';
import { BaseRepository } from '../base.repository';

export class CartRepository extends BaseRepository<ICartDocument> {
    constructor() {
        super(CartModel);
    }

    // Add product to cart
    async addProduct(
        ownerId: string,
        productId: string,
        quantity: number
    ): Promise<ICartDocument | null> {
        const cart = await this.findOne({ owner: ownerId } as any);
        if (!cart) return null;

        const existingProduct = cart.products.find(
            p => p.product_id === productId
        );

        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            cart.products.push({
                product_id: productId,
                quantity,
                addAt: new Date(),
            });
        }

        return await cart.save();
    }

    // Remove product from cart
    async removeProduct(
        ownerId: string,
        productId: string
    ): Promise<ICartDocument | null> {
        const cart = await this.findOne({ owner: ownerId } as any);
        if (!cart) return null;

        cart.products = cart.products.filter(p => p.product_id !== productId);

        return await cart.save();
    }

    // Update product quantity
    async updateProductQuantity(
        ownerId: string,
        productId: string,
        quantity: number
    ): Promise<ICartDocument | null> {
        const cart = await this.findOne({ owner: ownerId } as any);
        if (!cart) return null;

        const product = cart.products.find(p => p.product_id === productId);
        if (product) {
            product.quantity = quantity;
        }

        return await cart.save();
    }

    // Clear cart
    async clearCart(ownerId: string): Promise<ICartDocument | null> {
        const cart = await this.findOne({ owner: ownerId } as any);
        if (!cart) return null;

        cart.products = [];
        return await cart.save();
    }
}

export const cartRepository = new CartRepository();
