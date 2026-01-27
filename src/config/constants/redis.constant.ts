export const redisPrefix = {
    blacklist: 'blacklist', // `blacklist:${accessToken}` = 1
    refreshToken: 'refreshToken', // `refreshToken:${userId}:${refreshToken}` = deviceId
    productLockRace: 'productLockRace', // `productLockRace:${productId}:${sku}` = stock number
    productLockOnline: 'productLockOnline', // `productLockOnline:${productId}:${sku}` = stock num
    invoiceProducts: 'invoice-products', // `invoice-products:${invoiceId}` = JSON array of products
    checkoutSession: 'checkoutSession', // checkoutSession:${checkoutSessionId}:${checkoutSessionId} = mảng products giống lúc gửi lên khi create invoice, lưu trong 5p
};
