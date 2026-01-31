import { Types } from 'mongoose';
import { IWishlistDocument, WishlistModel } from '../../models/wishlist/wishlist.model'; 
import { BaseRepository } from '../base.repository';

export class WishlistRepository extends BaseRepository<IWishlistDocument> {
    constructor() {
        super(WishlistModel);
    }

    // Add product to wishlist
    async addProduct(
        owner: string,
        productId: string
    ): Promise<void> {
        let wishlist = await WishlistModel.findOne({ owner });

        if (!wishlist) {
            // chưa có wishlist -> tạo mới
            wishlist = await WishlistModel.create({
                owner,
                products: [
                    {
                        productId,
                        addedAt: new Date(),
                    },
                ],
            });
            return;
        }

        // đã tồn tại -> push nếu chưa có
        const isExist = wishlist.products.some(
            p => p.productId.toString() === productId
        );

        if (!isExist) {
            wishlist.products.push({
                productId: new Types.ObjectId(productId),
                addedAt: new Date(),
            });
            await wishlist.save();
        }
    }

    // Remove product from wishlist
    async removeProduct(
        owner: string,
        productId: string
    ): Promise<void> {
        const wishlist = await WishlistModel.findOne({ owner });
        if (!wishlist) return;

        wishlist.products = wishlist.products.filter(
            p => p.productId.toString() !== productId
        );

        await wishlist.save();
    }

    // Check product exists in wishlist
    async isExistProduct(
        ownerId: string,
        productId: string
    ): Promise<boolean> {
        const wishlist = await WishlistModel.findOne({
            owner: ownerId,
            products: {
                $elemMatch: {
                    productId: new Types.ObjectId(productId),
                },
            },
        });

        return !!wishlist;
    }

    // Get wishlist by owner
    async getWishlist(owner: string) {
        return WishlistModel.findOne({ owner }).populate(
            {
              path: 'products.productId',
              match: {
                deletedAt: null,
              },
            }
        );
    }

    // Clear wishlist
    async clearWishlist(owner: string): Promise<void> {
        const wishlist = await WishlistModel.findOne({ owner });
        if (!wishlist) return;

        wishlist.products = [];
        await wishlist.save();
    }
}

export const wishlistRepository = new WishlistRepository();
