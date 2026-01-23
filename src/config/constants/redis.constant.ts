export const redisPrefix = {
    blacklist: 'blacklist', // `blacklist:${accessToken}` = 1
    refreshToken: 'refreshToken', // `refreshToken:${userId}:${refreshToken}` = deviceId
    orderLockRace: 'orderLockRace', // `orderClock:${productId}:${sku}`
    orderLockOnline: 'orderLockOnline', // `orderClockOnline:${productId}:${sku}`
};
