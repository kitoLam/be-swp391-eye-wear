import mongoose, { Schema, model, Types } from 'mongoose';
import { Wishlist } from '../../types/wishlist/wishlist.type';

export type IWishlistDocument = Wishlist & mongoose.Document;

const WishlistSchema = new Schema<IWishlistDocument>(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      unique: true, // 1 user chỉ có 1 wishlist
    },

    products: [
      {
        productId: {
          type: Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index để tránh trùng product trong wishlist
WishlistSchema.index(
  { owner: 1, 'products.productId': 1 },
  { unique: true, sparse: true }
);

export const WishlistModel = model<IWishlistDocument>('Wishlist', WishlistSchema);
