// Order Type Enum
export enum OrderType {
    NORMAL = 'NORMAL',
    PRE_ORDER = 'PRE-ORDER',
    MANUFACTURING = 'MANUFACTURING',
}

// Order Status Enum
export enum OrderStatus {
    PENDING = 'PENDING', // Chờ xác minh
    ASSIGNED = 'ASSIGNED', // Đã phân công
    MAKING = 'MAKING', // Đang sản xuất
    PACKAGED = 'PACKAGED', // Đã đóng gói
}

// Assignment Status Enum
export enum AssignmentOrderStatus {
    PENDING = 'PENDING', // Chưa phân công
    ASSIGNED = 'ASSIGNED', // Đã phân công
    IN_PROGRESS = 'IN_PROGRESS', // Đang xử lý
    COMPLETED = 'COMPLETED', // Hoàn thành
}
