// Order Type Enum
export enum OrderType {
    NORMAL = 'NORMAL',
    PRE_ORDER = 'PRE-ORDER',
    MANUFACTURING = 'MANUFACTURING',
    RETURN = 'RETURN',
}

// Order Status Enum
export enum OrderStatus {
    PENDING = 'PENDING', // Chờ xác minh
    WAITING_ASSIGN = 'WAITING_ASSIGN', // Chờ phân công
    ASSIGNED = 'ASSIGNED', // Đã phân công
    MAKING = 'MAKING', // Đang sản xuất
    PACKAGING = 'PACKAGING', // Đã đóng gói
    COMPLETED = 'COMPLETED',
    CANCELED = 'CANCELED',
    REFUNDED = 'REFUNDED',
}
