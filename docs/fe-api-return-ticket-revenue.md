# API Doc cho FE: Return Ticket & Revenue

Tài liệu này tổng hợp các endpoint liên quan tới:
- Return Ticket (client + admin)
- Revenue theo invoice (admin)

## 1) Chuẩn response chung

Server trả response theo format:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Khi lỗi thường trả dạng:

```json
{
  "error": "..."
}
```

hoặc

```json
{
  "success": false,
  "message": "...",
  "code": "..."
}
```

---

## 2) Auth & Base path

- **Admin API base**: `/admin`
- **Client API base**: `/client`

### Auth
- Admin endpoints: Bearer token admin trong header `Authorization: Bearer <token>`
- Client endpoints: Bearer token client trong header `Authorization: Bearer <token>`

---

## 3) Revenue theo Invoice (Admin)

> Chỉ tính từ invoice có `status = DELIVERED`.
> Timezone xử lý nội bộ mặc định: `Asia/Ho_Chi_Minh`.

### 3.1 GET `/admin/invoices/stats/revenue`

Lấy thống kê doanh thu theo kỳ thời gian, có thể lọc theo `userId` (owner invoice).

#### Query params

| Field | Type | Required | Ghi chú |
|---|---|---:|---|
| `period` | `year` \| `month` \| `week` \| `day` | No | Mặc định `day` |
| `fromDate` | string (ISO datetime) | No | VD: `2026-01-01T00:00:00.000Z` |
| `toDate` | string (ISO datetime) | No | VD: `2026-12-31T23:59:59.999Z` |
| `userId` | string | No | Lọc theo owner của invoice |

Ràng buộc:
- Nếu truyền cả `fromDate` và `toDate` thì `fromDate <= toDate`.

#### Response data

```json
{
  "period": "day",
  "fromDate": "2026-03-01T00:00:00.000Z",
  "toDate": "2026-03-31T23:59:59.999Z",
  "userId": "69774ed2f1c9261ea78e34aa",
  "rows": [
    {
      "period": "2026-03-06",
      "totalRevenue": 60000,
      "invoiceCount": 1
    }
  ]
}
```

#### cURL mẫu

```bash
curl --location 'http://localhost:3000/admin/invoices/stats/revenue?period=month&userId=69774ed2f1c9261ea78e34aa' \
--header 'Authorization: Bearer <ADMIN_TOKEN>'
```

---

## 4) Return Ticket - Client APIs

## 4.1 POST `/client/return-tickets`

Client tạo return ticket.

### Request body

| Field | Type | Required | Ghi chú |
|---|---|---:|---|
| `orderId` | string | Yes | ID order cần trả |
| `reason` | string | Yes | Lý do trả |
| `description` | string | Yes | Mô tả chi tiết |
| `media` | string[] | No | Mặc định `[]` |

### Request sample

```json
{
  "orderId": "65fd8d5c8f9f4f2f8d8a1234",
  "reason": "Sản phẩm lỗi",
  "description": "Tròng kính bị xước",
  "media": [
    "https://cdn.example.com/return-1.jpg"
  ]
}
```

### Response data object

```json
{
  "id": "660001112233445566778899",
  "orderId": "65fd8d5c8f9f4f2f8d8a1234",
  "customerId": "6599aa11bb22cc33dd44ee55",
  "reason": "Sản phẩm lỗi",
  "description": "Tròng kính bị xước",
  "media": ["https://cdn.example.com/return-1.jpg"],
  "skus": [],
  "money": 120000,
  "staffVerify": null,
  "status": "PENDING",
  "createdAt": "2026-03-09 08:00:00",
  "updatedAt": "2026-03-09 08:00:00"
}
```

---

## 4.2 GET `/client/return-tickets`

Lấy danh sách return ticket của chính client.

### Query params

| Field | Type | Required | Ghi chú |
|---|---|---:|---|
| `page` | number | No | Mặc định `1` |
| `limit` | number | No | Mặc định `10` |
| `status` | enum | No | `PENDING`, `IN_PROGRESS`, `CANCEL`, `REJECTED`, `APPROVED`, `DELIVERING`, `RETURNED` |
| `orderId` | string | No | Lọc theo order |
| `search` | string | No | Tìm theo reason/description/orderId |

### Response data

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "returnTicketList": [
    {
      "id": "660001112233445566778899",
      "orderId": "65fd8d5c8f9f4f2f8d8a1234",
      "customerId": "6599aa11bb22cc33dd44ee55",
      "reason": "Sản phẩm lỗi",
      "description": "Tròng kính bị xước",
      "media": ["https://cdn.example.com/return-1.jpg"],
      "skus": [],
      "money": 120000,
      "staffVerify": null,
      "status": "PENDING",
      "createdAt": "2026-03-09 08:00:00",
      "updatedAt": "2026-03-09 08:00:00"
    }
  ]
}
```

---

## 5) Return Ticket - Admin APIs

### ReturnTicketStatus enum
- `PENDING`
- `IN_PROGRESS`
- `CANCEL`
- `REJECTED`
- `APPROVED`
- `DELIVERING`
- `RETURNED`

## 5.1 GET `/admin/return-tickets`

Lấy danh sách tất cả return ticket (staff/admin).

### Query params

| Field | Type | Required |
|---|---|---:|
| `page` | number | No |
| `limit` | number | No |
| `status` | enum(ReturnTicketStatus) | No |
| `orderId` | string | No |
| `customerId` | string | No |
| `staffVerify` | string | No |
| `search` | string | No |

### Response data

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  },
  "returnTicketList": [
    {
      "id": "660001112233445566778899",
      "orderId": "65fd8d5c8f9f4f2f8d8a1234",
      "customerId": "6599aa11bb22cc33dd44ee55",
      "reason": "Sản phẩm lỗi",
      "description": "Tròng kính bị xước",
      "media": [],
      "skus": [],
      "money": 120000,
      "staffVerify": "65staff001",
      "status": "APPROVED",
      "createdAt": "2026-03-09 08:00:00",
      "updatedAt": "2026-03-09 08:20:00"
    }
  ]
}
```

---

## 5.2 GET `/admin/return-tickets/my-history`

Lấy danh sách return ticket mà staff hiện tại đã verify (`staffVerify` = id trong token).

### Query params
Giống `GET /admin/return-tickets`.

### Response data
Giống `GET /admin/return-tickets`.

---

## 5.3 GET `/admin/return-tickets/returned-orders`

Lấy danh sách return ticket đã `RETURNED` kèm dữ liệu order tương ứng.

### Query params

| Field | Type | Required |
|---|---|---:|
| `page` | number | No |
| `limit` | number | No |
| `search` | string | No |

### Response data

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "returnedOrders": [
    {
      "returnTicket": {
        "id": "660001112233445566778899",
        "orderId": "65fd8d5c8f9f4f2f8d8a1234",
        "customerId": "6599aa11bb22cc33dd44ee55",
        "reason": "Sản phẩm lỗi",
        "description": "Tròng kính bị xước",
        "media": [],
        "skus": [],
        "money": 120000,
        "staffVerify": "65staff001",
        "status": "RETURNED",
        "createdAt": "2026-03-09 08:00:00",
        "updatedAt": "2026-03-10 09:00:00"
      },
      "order": {
        "_id": "65fd8d5c8f9f4f2f8d8a1234"
      }
    }
  ]
}
```

> `order` là object order trả trực tiếp từ DB, FE nên parse linh hoạt theo field thực tế nhận được.

---

## 5.4 PATCH `/admin/return-tickets/:id/staff-verify`

Gán `staffVerify` = id staff hiện tại.

### Path params
| Field | Type | Required |
|---|---|---:|
| `id` | string(ObjectId) | Yes |

### Body
- Không có body.

### Response data
Trả về object return ticket đã update (format giống các endpoint list/detail mapResponse).

---

## 5.5 PATCH đổi trạng thái return ticket

Tất cả endpoint dưới đây:
- Không có request body
- Dùng path param `:id` (ObjectId)
- Response: object return ticket sau cập nhật

### 5.5.1 PATCH `/admin/return-tickets/:id/status/approved`
- Set `status = APPROVED`

### 5.5.2 PATCH `/admin/return-tickets/:id/status/rejected`
- Set `status = REJECTED`

### 5.5.3 PATCH `/admin/return-tickets/:id/status/in-progress`
- Set `status = IN_PROGRESS`

### 5.5.4 PATCH `/admin/return-tickets/:id/status/cancel`
- Set `status = CANCEL`

### 5.5.5 PATCH `/admin/return-tickets/:id/status/delivering`
- Set `status = DELIVERING`

### 5.5.6 PATCH `/admin/return-tickets/:id/status/returned`
- Set `status = RETURNED`

Response data mẫu:

```json
{
  "id": "660001112233445566778899",
  "orderId": "65fd8d5c8f9f4f2f8d8a1234",
  "customerId": "6599aa11bb22cc33dd44ee55",
  "reason": "Sản phẩm lỗi",
  "description": "Tròng kính bị xước",
  "media": [],
  "skus": [],
  "money": 120000,
  "staffVerify": "65staff001",
  "status": "RETURNED",
  "createdAt": "2026-03-09 08:00:00",
  "updatedAt": "2026-03-10 09:00:00"
}
```

---

## 6) Gợi ý FE mapping nhanh

- Danh sách trạng thái return ticket để render tab/filter:
  - `PENDING`, `APPROVED`, `REJECTED`, `IN_PROGRESS`, `DELIVERING`, `RETURNED`, `CANCEL`
- Revenue chart:
  - X-axis = `rows[].period`
  - Y-axis = `rows[].totalRevenue`
  - Tooltip thêm `rows[].invoiceCount`

---

## 7) Checklist test Postman nhanh

1. Đăng nhập lấy token admin/client.
2. Test `GET /admin/invoices/stats/revenue` (không filter).
3. Test `GET /admin/invoices/stats/revenue?userId=...`.
4. Client tạo return ticket: `POST /client/return-tickets`.
5. Admin duyệt luồng status qua các endpoint patch.
6. Kiểm tra `GET /admin/return-tickets/returned-orders`.

