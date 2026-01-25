## Lỗi kiến trúc: Sự không đồng nhất giữa Schema và Service

### 1. Xung đột Schema (Zod) vs Service Interface
- **Zod Schema:** Mong đợi `orders: string[]` (Danh sách ID đơn hàng có sẵn).
- **Service Logic:** Mong đợi `products: OrderProduct[]` để khởi tạo đơn hàng mới.
- **Hệ quả:** Request từ Frontend sẽ bị Middleware Validation từ chối (400 Bad Request) vì không khớp cấu trúc dữ liệu.

### 2. Lỗ hổng Payment Method
- Trường `paymentMethod` cực kỳ quan trọng để quyết định việc "Trừ kho ngay" (COD) hay "Giữ kho tạm thời" (Online).
- **Lỗi:** Trường này xuất hiện trong Service nhưng vắng mặt trong Zod Schema. Dữ liệu này sẽ bị lọc bỏ trước khi vào đến Controller.

### 3. Thừa dữ liệu Input (Redundant Data)
- `totalPrice` và `totalDiscount` đang bị bắt buộc nhập ở Schema.
- **Vấn đề:** Đây là các trường nên được tính toán phía Server (Server-side calculation) để đảm bảo tính toàn vẹn, tránh việc Client gian lận giá bằng cách gửi body tùy chỉnh.

### 4. Sai lệch quy tắc nhóm đơn hàng nếu làm theo kiểu (Order Grouping Logic)
Vấn đề: Service đang khởi tạo mỗi sản phẩm là một đơn hàng riêng biệt (Order) do đặt logic tạo đơn trong vòng lặp for...of.

Lỗi logic: - Các sản phẩm thường (không kèm lens) lẽ ra phải được gom chung vào 01 Order duy nhất để tối ưu vận chuyển.

Các sản phẩm gia công (có kèm lens) hoặc Pre-order mới cần tách riêng từng đơn (do đặc thù kỹ thuật và thời gian chờ).

Hệ quả: Một Invoice sẽ chứa quá nhiều Order con không cần thiết, gây khó khăn cho việc quản lý kho, đóng gói và gây bối rối cho khách hàng khi theo dõi vận đơn.