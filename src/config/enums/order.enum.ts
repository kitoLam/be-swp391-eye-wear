// Order Type Enum
export enum OrderType {
    NORMAL = 'NORMAL',
    PRE_ORDER = 'PRE-ORDER',
    MANUFACTURING = 'MANUFACTURING',
}

// Order Status Enum
export enum OrderStatus {
    PENDING = 'PENDING', // Chờ xác minh
    VERIFIED = 'VERIFIED', // Đã xác minh
    APPROVED = 'APPROVED', // Đã duyệt
    ASSIGNED = 'ASSIGNED', // Đã phân công
    MAKING = 'MAKING', // Đang sản xuất
    PACKAGED = 'PACKAGED', // Đã đóng gói
    REJECTED = 'REJECTED', // Bị từ chối
    CANCEL = 'CANCEL', // Đã hủy
}

// Assignment Status Enum
export enum AssignmentOrderStatus {
    PENDING = 'PENDING', // Chưa phân công
    ASSIGNED = 'ASSIGNED', // Đã phân công
    IN_PROGRESS = 'IN_PROGRESS', // Đang xử lý
    COMPLETED = 'COMPLETED', // Hoàn thành
}
