# Invoice & Payment API - Complete Reference

**Base URL:** `http://localhost:5000/api/v1/client`

**Authentication:** Required (Customer token)

---

## 📋 Invoice Endpoints

### 1. Create Invoice

**Method:** `POST`  
**URL:** `/api/v1/client/invoices`

Tạo hóa đơn từ các đơn hàng (orders).

#### Headers

```
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

#### Request Body

```json
{
  "orders": ["order123", "order456"],
  "address": {
    "no": "123 Nguyen Hue",
    "ward": "Ben Nghe",
    "city": "Ho Chi Minh"
  },
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "voucher": ["SUMMER2026"],
  "totalDiscount": 500000
}
```

#### Field Descriptions

| Field           | Type     | Required | Description                  |
| --------------- | -------- | -------- | ---------------------------- |
| `orders`        | string[] | Yes      | Array of Order IDs           |
| `address`       | object   | Yes      | Shipping address             |
| `fullName`      | string   | Yes      | Recipient name               |
| `phone`         | string   | Yes      | Contact phone                |
| `voucher`       | string[] | No       | Voucher codes                |
| `totalDiscount` | number   | No       | Discount amount (default: 0) |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Tạo hóa đơn thành công!",
  "data": {
    "invoice": {
      "_id": "invoice123",
      "orders": ["order123", "order456"],
      "owner": "customer123",
      "totalPrice": 8000000,
      "totalDiscount": 500000,
      "address": {...},
      "status": "PENDING",
      "fullName": "Nguyen Van A",
      "phone": "0901234567",
      "createdAt": "2026-01-19T00:00:00.000Z"
    }
  }
}
```

---

### 2. Get Invoices List

**Method:** `GET`  
**URL:** `/api/v1/client/invoices`

#### Headers

```
Authorization: Bearer {{customer_token}}
```

#### Query Parameters

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `page`    | number | No       | Page number (default: 1)     |
| `limit`   | number | No       | Items per page (default: 10) |
| `status`  | string | No       | Filter by status             |

#### Example URLs

```
GET /api/v1/client/invoices
GET /api/v1/client/invoices?page=1&limit=10
GET /api/v1/client/invoices?status=PENDING
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy danh sách hóa đơn thành công!",
  "data": {
    "items": [
      {
        "_id": "invoice123",
        "totalPrice": 8000000,
        "totalDiscount": 500000,
        "status": "PENDING",
        "createdAt": "2026-01-19T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 3. Get Invoice Detail

**Method:** `GET`  
**URL:** `/api/v1/client/invoices/:id`

#### Headers

```
Authorization: Bearer {{customer_token}}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy chi tiết hóa đơn thành công!",
  "data": {
    "invoice": {
      "_id": "invoice123",
      "orders": ["order123", "order456"],
      "owner": "customer123",
      "totalPrice": 8000000,
      "totalDiscount": 500000,
      "address": {
        "no": "123 Nguyen Hue",
        "ward": "Ben Nghe",
        "city": "Ho Chi Minh"
      },
      "status": "PENDING",
      "fullName": "Nguyen Van A",
      "phone": "0901234567",
      "createdAt": "2026-01-19T00:00:00.000Z"
    }
  }
}
```

---

### 4. Update Invoice

**Method:** `PATCH`  
**URL:** `/api/v1/client/invoices/:id`

#### Headers

```
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

#### Request Body (Partial Update)

```json
{
  "address": {
    "no": "456 Le Loi",
    "ward": "Ben Thanh",
    "city": "Ho Chi Minh"
  },
  "phone": "0909876543"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật hóa đơn thành công!",
  "data": {
    "invoice": {...}
  }
}
```

---

## 💳 Payment Endpoints

### 1. Create Payment

**Method:** `POST`  
**URL:** `/api/v1/client/payments`

Tạo thanh toán cho hóa đơn.

#### Headers

```
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

#### Request Body

```json
{
  "invoice_id": "invoice123",
  "payment_method": "BANK",
  "price": 8000000,
  "note": "Thanh toán qua VNPay"
}
```

#### Field Descriptions

| Field            | Type   | Required | Description                     |
| ---------------- | ------ | -------- | ------------------------------- |
| `invoice_id`     | string | Yes      | Invoice ID to pay for           |
| `payment_method` | enum   | Yes      | 'CASH' or 'BANK'                |
| `price`          | number | Yes      | Payment amount (can be partial) |
| `note`           | string | No       | Payment note                    |

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Tạo thanh toán thành công!",
  "data": {
    "payment": {
      "_id": "payment123",
      "owner_id": "customer123",
      "invoice_id": "invoice123",
      "payForOrder": "invoice123",
      "payment_method": "BANK",
      "price": 8000000,
      "status": "UNPAID",
      "note": "Thanh toán qua VNPay",
      "createdAt": "2026-01-19T00:00:00.000Z"
    }
  }
}
```

---

### 2. Get Payments List

**Method:** `GET`  
**URL:** `/api/v1/client/payments`

#### Headers

```
Authorization: Bearer {{customer_token}}
```

#### Query Parameters

| Parameter | Type   | Required | Description                           |
| --------- | ------ | -------- | ------------------------------------- |
| `page`    | number | No       | Page number (default: 1)              |
| `limit`   | number | No       | Items per page (default: 10)          |
| `status`  | string | No       | Filter by status ('PAID' or 'UNPAID') |

#### Example URLs

```
GET /api/v1/client/payments
GET /api/v1/client/payments?status=PAID
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy danh sách thanh toán thành công!",
  "data": {
    "items": [
      {
        "_id": "payment123",
        "invoice_id": "invoice123",
        "payment_method": "BANK",
        "price": 8000000,
        "status": "PAID",
        "createdAt": "2026-01-19T00:00:00.000Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### 3. Get Payment Detail

**Method:** `GET`  
**URL:** `/api/v1/client/payments/:id`

#### Headers

```
Authorization: Bearer {{customer_token}}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy chi tiết thanh toán thành công!",
  "data": {
    "payment": {
      "_id": "payment123",
      "owner_id": "customer123",
      "invoice_id": "invoice123",
      "payment_method": "BANK",
      "price": 8000000,
      "status": "PAID",
      "note": "Thanh toán qua VNPay",
      "createdAt": "2026-01-19T00:00:00.000Z"
    }
  }
}
```

---

## 🔄 Complete Workflow

### Scenario: Customer Checkout Process

#### Step 1: Create Orders

```bash
POST /api/v1/client/orders
# Creates order(s) from cart items
```

#### Step 2: Create Invoice

```bash
POST /api/v1/client/invoices
{
  "orders": ["order123", "order456"],
  "address": {...},
  "fullName": "Nguyen Van A",
  "phone": "0901234567"
}
```

#### Step 3: Create Payment

```bash
POST /api/v1/client/payments
{
  "invoice_id": "invoice123",
  "payment_method": "BANK",
  "price": 7500000
}
```

**Result:**

- Invoice status: `PENDING` → `PAIDED` (if full payment)
- Invoice status: `PENDING` → `DEPOSITED` (if partial payment)

---

## 📊 Invoice Status Flow

```
PENDING → DEPOSITED → PAIDED → COMPLETE
```

- **PENDING**: Invoice created, awaiting payment
- **DEPOSITED**: Partial payment received
- **PAIDED**: Full payment received
- **COMPLETE**: Order completed and delivered

---

## 💡 Business Logic

### Invoice Total Calculation

```typescript
totalPrice = sum(orders.price);
finalAmount = totalPrice - totalDiscount;
```

### Payment Impact on Invoice

- **Full Payment** (`price >= finalAmount`): Invoice → `PAIDED`
- **Partial Payment** (`0 < price < finalAmount`): Invoice → `DEPOSITED`

### Refund Support

- Payment `price` can be **negative** for refunds
- Example: `{ "price": -2000000, "note": "Refund for cancelled order" }`

---

## 📊 Endpoint Summary

| #   | Method | Endpoint               | Description        |
| --- | ------ | ---------------------- | ------------------ |
| 1   | POST   | `/client/invoices`     | Create invoice     |
| 2   | GET    | `/client/invoices`     | Get invoices list  |
| 3   | GET    | `/client/invoices/:id` | Get invoice detail |
| 4   | PATCH  | `/client/invoices/:id` | Update invoice     |
| 5   | POST   | `/client/payments`     | Create payment     |
| 6   | GET    | `/client/payments`     | Get payments list  |
| 7   | GET    | `/client/payments/:id` | Get payment detail |

---

## ⚠️ Error Handling

### Common Errors

**404 - Invoice Not Found**

```json
{
  "success": false,
  "message": "Invoice not found"
}
```

**400 - Invalid Payment Amount**

```json
{
  "success": false,
  "message": "Payment amount must be greater than 0"
}
```

**400 - Discount Exceeds Total**

```json
{
  "success": false,
  "message": "Total discount cannot exceed total price"
}
```
