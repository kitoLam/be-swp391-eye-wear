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

    // Add product to cart
    async addProduct(
        ownerId: string,
        cartItem: CartItemCreate,
        quantity: number
    ): Promise<void> {
        await CartModel.updateOne(
            {
                owner: ownerId,
            },
            {
                $push: {
                    products: {
                        product: cartItem.product,
                        lens: cartItem.lens,
                        quantity,
                    },
                },
            }
        );
    }

    // Remove product from cart
    async removeProduct(
        ownerId: string,
        cartItem: CartItemBaseRequest
    ): Promise<void> {
        // Tạo filter cho phần tử cần xóa
        const itemMatch: any = {};

        if (cartItem.product) {
            itemMatch['product.product_id'] = cartItem.product.product_id;
            itemMatch['product.sku'] = cartItem.product.sku;
        } else itemMatch['product'] = undefined;

        if (cartItem.lens) {
            itemMatch['lens.lens_id'] = cartItem.lens.lens_id;
            itemMatch['lens.sku'] = cartItem.lens.sku;
        } else itemMatch['lens'] = undefined;

        await CartModel.updateOne(
            { owner: ownerId },
            {
                $pull: {
                    products: itemMatch,
                },
            }
        );
    }

    // Update product quantity
    async updateProductQuantity(
        ownerId: string,
        cartItem: CartItemBaseRequest,
        quantity: number
    ): Promise<void> {
        // Xây dựng điều kiện tìm kiếm phần tử trong mảng products
        const itemMatch: any = {};
        if (cartItem.product) {
            itemMatch['product.product_id'] = cartItem.product.product_id;
            itemMatch['product.sku'] = cartItem.product.sku;
        }
        if (cartItem.lens) {
            itemMatch['lens.lens_id'] = cartItem.lens.lens_id;
            itemMatch['lens.sku'] = cartItem.lens.sku;
        }

        await CartModel.updateOne(
            {
                owner: ownerId,
                products: { $elemMatch: itemMatch },
            },
            {
                $set: {
                    'products.$.quantity': quantity,
                },
            }
        );
    }
    // Update product quantity
    async increaseProductQuantity(
        ownerId: string,
        cartItem: CartItemBaseRequest,
        quantity: number
    ): Promise<void> {
        // Xây dựng điều kiện tìm kiếm phần tử trong mảng products
        const itemMatch: any = {};
        if (cartItem.product) {
            itemMatch['product.product_id'] = cartItem.product.product_id;
            itemMatch['product.sku'] = cartItem.product.sku;
        } else itemMatch['product'] = undefined;
        if (cartItem.lens) {
            itemMatch['lens.lens_id'] = cartItem.lens.lens_id;
            itemMatch['lens.sku'] = cartItem.lens.sku;
        } else itemMatch['lens'] = undefined;

        await CartModel.updateOne(
            {
                owner: ownerId,
                products: { $elemMatch: itemMatch },
            },
            {
                $inc: {
                    'products.$.quantity': quantity,
                },
            }
        );
    }
    async updateProductPrescription(
        ownerId: string,
        cartItem: CartItemBaseRequest,
        prescription: LensParameters
    ): Promise<void> {
        const itemMatch: any = {};

        if (cartItem.product) {
            itemMatch['product.product_id'] = cartItem.product.product_id;
            itemMatch['product.sku'] = cartItem.product.sku;
        } else itemMatch['product'] = undefined;

        if (cartItem.lens) {
            itemMatch['lens.lens_id'] = cartItem.lens.lens_id;
            itemMatch['lens.sku'] = cartItem.lens.sku;
        } else itemMatch['lens'] = undefined;

        await CartModel.updateOne(
            {
                owner: ownerId,
                products: { $elemMatch: itemMatch },
            },
            {
                $set: {
                    // Giả sử cấu trúc lưu trữ là products[index].lens.parameters
                    'products.$.lens.parameters': prescription,
                },
            }
        );
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
