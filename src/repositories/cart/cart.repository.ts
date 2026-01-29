import { CartModel, ICartDocument } from '../../models/cart/cart.model.mongo';
import {
    CartItemBaseRequest,
    CartItemCreate,
} from '../../types/cart/cart.request';
import { LensParameters } from '../../types/lens-parameters/lens-parameters';
import { BaseRepository } from '../base.repository';

export class CartRepository extends BaseRepository<ICartDocument> {
    constructor() {
        super(CartModel);
    }
    private isMatching(item: any, target: CartItemBaseRequest): boolean {
        const isSameProduct =
            item.product?.product_id === target.product?.product_id &&
            item.product?.sku === target.product?.sku;

        // So sánh Lens: Cả hai cùng không có Lens HOẶC cả hai cùng có Lens giống nhau
        const isSameLens =
            (!item.lens && !target.lens) ||
            (item.lens?.lens_id === target.lens?.lens_id &&
                item.lens?.sku === target.lens?.sku);

        return isSameProduct && isSameLens;
    }
    // Add product to cart
    async addProduct(
        ownerId: string,
        cartItem: CartItemCreate,
        quantity: number
    ): Promise<void> {
        const modelItem = await CartModel.findOne({
            owner: ownerId,
        });
        if (modelItem) {
            modelItem.products.push({
                product: cartItem.product,
                lens: cartItem.lens,
                quantity,
                addAt: new Date(),
            });
            await modelItem.save();
        }
    }

    // Remove product from cart
    async removeProduct(
        ownerId: string,
        cartItem: CartItemBaseRequest
    ): Promise<void> {
        const modelItem = await CartModel.findOne({ owner: ownerId });
        if (modelItem) {
            modelItem.products = modelItem.products.filter(
                item => !this.isMatching(item, cartItem)
            );
            await modelItem.save();
        }
    }

    // Update product quantity
    async updateProductQuantity(
        ownerId: string,
        cartItem: CartItemBaseRequest,
        quantity: number
    ): Promise<void> {
        const modelItem = await CartModel.findOne({
            owner: ownerId,
        });
        if (modelItem) {
            const item = modelItem.products.find(p =>
                this.isMatching(p, cartItem)
            );
            if (item) {
                item.quantity = quantity;
                await modelItem.save();
            }
        }
    }
    // Update product quantity
    async increaseProductQuantity(
        ownerId: string,
        cartItem: CartItemBaseRequest,
        quantity: number
    ): Promise<void> {
        const modelItem = await CartModel.findOne({
            owner: ownerId,
        });
        if (modelItem) {
            const item = modelItem.products.find(p =>
                this.isMatching(p, cartItem)
            );
            if (item) {
                item.quantity += quantity;
                await modelItem.save();
            }
        }
    }
    async updateProductPrescription(
        ownerId: string,
        cartItem: CartItemBaseRequest,
        prescription: LensParameters
    ): Promise<void> {
        const modelItem = await CartModel.findOne({
            owner: ownerId,
        });
        if (modelItem) {
            const item = modelItem.products.find(p =>
                this.isMatching(p, cartItem)
            );
            if (item && item.lens) {
                item.lens.parameters = prescription;
                await modelItem.save();
            }
        }
    }

    // Clear cart
    async clearCart(ownerId: string): Promise<ICartDocument | null> {
        const cart = await this.findOne({ owner: ownerId } as any);
        if (!cart) return null;

        cart.products = [];
        return await cart.save();
    }


    async isExistItemInCart(
        ownerId: string,
        cartItem: CartItemBaseRequest
    ): Promise<boolean> {
        const queryElementMatch: any = {};

        if (cartItem.product) {
            queryElementMatch['product.product_id'] =
                cartItem.product.product_id;
            queryElementMatch['product.sku'] = cartItem.product.sku;
        } else queryElementMatch['product'] = undefined;

        if (cartItem.lens) {
            queryElementMatch['lens.lens_id'] = cartItem.lens.lens_id;
            queryElementMatch['lens.sku'] = cartItem.lens.sku;
        } else queryElementMatch['lens'] = undefined;
        const existCartItem = await CartModel.findOne({
            owner: ownerId,
            products: {
                $elemMatch: queryElementMatch,
            },
        });
        return existCartItem ? true : false;
    }
}

export const cartRepository = new CartRepository();
