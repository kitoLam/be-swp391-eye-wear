import { NextFunction, Request, Response } from "express";
import { ClientCreateOrder } from "../../types/order/order";
import redisService from "../../services/redis.service";
import { redisPrefix } from "../../config/constants/redis.constant";
import { productRepository } from "../../repositories/product/product.repository";
import { ConflictRequestError, NotFoundRequestError } from "../../errors/apiError/api-error";
type ClockKey = {
  key: string,
  quantity: number
}
const releaseKey = async (items: ClockKey[]) => {
  for (const item of items) {
    const stockIsAcquiring = await redisService.getDataByKey<number>(item.key);
    if(stockIsAcquiring != null){
      await redisService.setDataWithExpiredTime(item.key , stockIsAcquiring - item.quantity, 10);
    }
  }
}

export const checkStockMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as ClientCreateOrder;
  const successKeys: ClockKey[] = []
  for(const item of body.products){
    if(item.product){
      // lấy ra stock đang bị giữ hiên tại
      const stockIsAcquiring = await redisService.getDataByKey<number>(`${redisPrefix.orderClock}-${item.product.product_id}-${item.product.sku}`) || 0;
      const product = await productRepository.findOne({
        _id: item.product.product_id,
        deletedAt: null
      });
      if(!product){
        releaseKey(successKeys);
        throw new NotFoundRequestError(`Product not found: ${item.product.product_id}`);
      }
      const variant = product.variants.find(v => v.sku === item.product?.sku);
      if(!variant){
        releaseKey(successKeys);
        throw new NotFoundRequestError(`Product not found: ${item.product.product_id}`);
      }
      if(variant.stock < item.quantity + stockIsAcquiring){
        releaseKey(successKeys);
        throw new ConflictRequestError("Product out of stock");
      }
      const key = `${redisPrefix.orderClock}-${item.product.product_id}-${item.product.sku}`;
      // lưu key vào redis
      await redisService.setDataWithExpiredTime(key , item.quantity + stockIsAcquiring, 10);
      successKeys.push({
        key,
        quantity: item.quantity,
      })
    }
    if(item.lens){
      // lấy ra stock đang bị giữ hiên tại
      const stockIsAcquiring = await redisService.getDataByKey<number>(`${redisPrefix.orderClock}-${item.lens.lens_id}-${item.lens.sku}`) || 0;
      const lens = await productRepository.findOne({
        _id: item.lens.lens_id,
        type: "lens",
        deletedAt: null
      });
      if(!lens){
        releaseKey(successKeys);
        throw new NotFoundRequestError(`Lens not found: ${item.lens.lens_id}`);
      }
      const variant = lens.variants.find(v => v.sku === item.lens?.sku);
      if(!variant){
        releaseKey(successKeys);
        throw new NotFoundRequestError(`Lens not found: ${item.lens.lens_id}`);
      }
      if(variant.stock < item.quantity + stockIsAcquiring){
        releaseKey(successKeys);
        throw new ConflictRequestError("Lens out of stock");
      }
      const key = `${redisPrefix.orderClock}-${item.lens.lens_id}-${item.lens.sku}`;
      // lưu key vào redis
      await redisService.setDataWithExpiredTime(key , item.quantity + stockIsAcquiring, 10);
      successKeys.push({
        key,
        quantity: item.quantity,
      })
    }
  }
  next();
}
