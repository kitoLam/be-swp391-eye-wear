import { ConflictRequestError, NotFoundRequestError } from "../../errors/apiError/api-error";
import { wishlistRepository } from "../../repositories/wishlist/wishlist.repository";
import { AuthCustomerContext } from "../../types/context/context";

class WishlistService {

  /**
   * Get wishlist by owner
   * If wishlist not exists, create a new one
   * @param {AuthCustomerContext} customerContext - admin context
   * @returns {Promise<IWishlistDocument>} - wishlist document
   */
  getWishlist = async (customerContext: AuthCustomerContext) => {
    const wishlist = await wishlistRepository.getWishlist(customerContext.id);
    if(!wishlist){
      return await wishlistRepository.create({
        owner: customerContext.id,
        products: []
      })
    }
    return wishlist;
  }
  /**
   * Add product to wishlist
   * Throw ConflictRequestError if product already exists in wishlist
   * @param {string} productId - product id
   * @param {AuthCustomerContext} customerContext - admin context
   * @returns {Promise<void>}
   */
  addProductToWishlist = async (productId: string, customerContext: AuthCustomerContext) => {
    if(await wishlistRepository.isExistProduct(customerContext.id, productId)){
      throw new ConflictRequestError('Product already exists in wishlist');
    }
    await wishlistRepository.addProduct(customerContext.id, productId);
  }

  /**
   * Remove product from wishlist
   * Throw ConflictRequestError if product does not exist in wishlist
   * @param {string} productId - product id
   * @param {AuthCustomerContext} customerContext - admin context
   * @returns {Promise<void>}
   */
  removeProductFromWishlist = async (productId: string, customerContext: AuthCustomerContext) => { 
    if(!(await wishlistRepository.isExistProduct(customerContext.id, productId))){
      throw new ConflictRequestError('Product does not exists in wishlist');
    }
    await wishlistRepository.removeProduct(customerContext.id, productId);
  }

  /**
   * Clear all products from wishlist
   * @param {AuthCustomerContext} customerContext - admin context
   * @returns {Promise<void>}
   */
  clearAllProductFromWishlist = async (customerContext: AuthCustomerContext) => {
    await wishlistRepository.clearWishlist(customerContext.id);
  }
}

export default new WishlistService();