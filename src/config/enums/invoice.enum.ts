// Invoice Status Enum
export enum InvoiceStatus {
    PENDING = 'PENDING', // Chờ đặt cọc
    DEPOSITED = 'DEPOSITED', // Đã đặt cọc
    WAITING_ASSIGN = 'WAITING_ASSIGN', // Chờ phân công manager
    ONBOARD = 'ONBOARD', // Manager đang quản lý
    COMPLETED = 'COMPLETED', // Hoàn thành (tất cả orders đã PACKAGED)
    DELIVERING = 'DELIVERING', // Đang giao hàng
    DELIVERED = 'DELIVERED', // Đã giao hàng
}
