import { Request, Response } from "express";
import wishlistService from "../../services/client/wishlist.service";
import { ApiResponse } from "../../utils/api-response";

class WishlistController {
  getWishlist = async (req: Request, res: Response) => {
    const wishlist = await wishlistService.getWishlist(req.customer!);
    res.json(ApiResponse.success('Get wishlist successfully', { wishlist }));
  }

  addToWishlist = async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    await wishlistService.addProductToWishlist( productId, req.customer!);
    res.json(ApiResponse.success('Add to wishlist successfully', null));
  }

  removeFromWishlist = async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    await wishlistService.removeProductFromWishlist( productId, req.customer!);
    res.json(ApiResponse.success('Remove from wishlist successfully', null));
  }

  clearWishlist = async (req: Request, res: Response) => {
    await wishlistService.clearAllProductFromWishlist(req.customer!);
    res.json(ApiResponse.success('Clear wishlist successfully', null));
  }
}

export default new WishlistController();