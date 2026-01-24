export const redisPrefix = {
    blacklist: 'blacklist', // `blacklist:${accessToken}` = 1
    refreshToken: 'refreshToken', // `refreshToken:${userId}:${refreshToken}` = deviceId
    orderLockRace: 'orderLockRace', // `orderLockRace:${productId}:${sku}`
    orderLockOnline: 'orderLockOnline', // `orderLockOnline:${productId}:${sku}`
    invoiceProducts: 'invoice-products', // `invoice-products:${invoiceId}` = JSON array of products
};
