export const redisPrefix = {
    blacklist: 'blacklist', // `blacklist:${accessToken}` = 1
    refreshToken: 'refreshToken', // `refreshToken:${userId}:${refreshToken}` = deviceId
    productLockRace: 'productLockRace', // `productLockRace:${productId}:${sku}`
    productLockOnline: 'productLockOnline', // `productLockOnline:${productId}:${sku}`
    invoiceProducts: 'invoice-products', // `invoice-products:${invoiceId}` = JSON array of products
};
