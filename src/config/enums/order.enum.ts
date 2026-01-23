export enum OrderType {
  NORMAL =  'NORMAL',
  PRE_ORDER = 'PRE-ORDER',
  MANUFACTURING = 'MANUFACTURING',
};
export enum VerifyOrderStatus {
  PENDING = 'PENDING',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}
export enum AssignmentOrderStatus {
  PENDING = 'PENDING', //
  PROCESSING = 'ASSIGNED', // đã giao cho nhân viên tiếp quản (Manager mới làm đc)
  WAITING_MANUFACTURER = "WAITING_MANUFACTURER", 
  PACKING = "PACKING",
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
// PENDING -> CONFIRM/CANCELLED/REJECT -> WAITING_STOCK -> WAITING_MANUFACTURER -> PACKING -> DELIVERED
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRM = "CONFIRM", // được staff confirm
  WAITING_STOCK = "WAITING_STOCK", // cho đơn pre-order
  WAITING_MANUFACTURER = "WAITING_MANUFACTURER", // chỉ với đơn cần gia công
  PACKING = "PACKING", 
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED', // bị hủy
}