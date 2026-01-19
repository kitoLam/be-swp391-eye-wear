# Voucher API with Neo4j - Complete Reference

**Base URL:** `http://localhost:5000/api/v1`

---

## 🎯 Overview

Hệ thống Voucher sử dụng **Dual Database**:

- **MongoDB**: Lưu thông tin voucher (code, value, dates, limits)
- **Neo4j**: Quản lý quan hệ User-Voucher

---

## 🔐 Admin Endpoints

### 1. Create Voucher

**POST** `/admin/vouchers`

**Headers:**

```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Voucher mùa hè 2026",
  "code": "SUMMER2026",
  "description": "Giảm 20% cho đơn hàng trên 1 triệu",
  "typeDiscount": "PERCENTAGE",
  "value": 20,
  "maxDiscountValue": 500000,
  "minOrderValue": 1000000,
  "usageLimit": 100,
  "startedDate": "2026-06-01T00:00:00.000Z",
  "endedDate": "2026-08-31T23:59:59.999Z",
  "applyScope": "SPECIFIC",
  "status": "ACTIVE"
}
```

**Field Descriptions:**
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Tên voucher |
| `code` | string | Mã voucher (unique, uppercase) |
| `typeDiscount` | enum | 'FIXED' hoặc 'PERCENTAGE' |
| `value` | number | Giá trị (% hoặc số tiền) |
| `maxDiscountValue` | number | Giảm tối đa |
| `minOrderValue` | number | Giá trị đơn tối thiểu |
| `usageLimit` | number | Số lượt sử dụng |
| `applyScope` | enum | 'ALL' (công khai) hoặc 'SPECIFIC' (riêng tư) |
| `status` | enum | 'DRAFT', 'ACTIVE', 'DISABLE' |

**Response (200):**

```json
{
  "success": true,
  "message": "Tạo voucher thành công!",
  "data": {
    "voucher": {
      "_id": "voucher123",
      "code": "SUMMER2026",
      ...
    }
  }
}
```

---

### 2. List Vouchers

**GET** `/admin/vouchers?page=1&limit=10&status=ACTIVE&applyScope=SPECIFIC`

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `applyScope`: Filter by scope

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### 3. Get Voucher Detail

**GET** `/admin/vouchers/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "voucher": {
      "_id": "voucher123",
      "code": "SUMMER2026",
      "usageCount": 15,
      "neo4jStats": {
        "totalGranted": 50,
        "totalUsed": 15,
        "totalUnused": 35
      }
    }
  }
}
```

---

### 4. Update Voucher

**PATCH** `/admin/vouchers/:id`

**Request Body (Partial):**

```json
{
  "status": "DISABLE",
  "usageLimit": 200
}
```

---

### 5. Delete Voucher

**DELETE** `/admin/vouchers/:id`

**Logic:**

- Soft delete in MongoDB
- Delete node + relationships in Neo4j

---

### 6. Grant Voucher to Users

**POST** `/admin/vouchers/:id/grant`

**Request Body:**

```json
{
  "userIds": ["customer123", "customer456", "customer789"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đã cấp voucher SUMMER2026 cho 3 users",
  "data": {
    "voucherCode": "SUMMER2026",
    "grantedCount": 3
  }
}
```

---

### 7. Revoke Voucher from Users

**POST** `/admin/vouchers/:id/revoke`

**Request Body:**

```json
{
  "userIds": ["customer123"]
}
```

---

### 8. Get Users with Voucher

**GET** `/admin/vouchers/:id/users`

**Response:**

```json
{
  "success": true,
  "data": {
    "voucher": {
      "code": "SUMMER2026",
      "name": "Voucher mùa hè"
    },
    "users": [
      {
        "userId": "customer123",
        "email": "user@example.com",
        "grantedAt": "2026-06-01T00:00:00.000Z",
        "grantedBy": "admin123",
        "used": false,
        "usedAt": null
      }
    ]
  }
}
```

---

### 9. Get User's Vouchers

**GET** `/admin/users/:userId/vouchers`

**Response:**

```json
{
  "success": true,
  "data": {
    "vouchers": [...]
  }
}
```

---

### 10. Get Statistics

**GET** `/admin/vouchers/statistics`

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 50,
    "byStatus": [
      { "status": "ACTIVE", "count": 30 },
      { "status": "DRAFT", "count": 15 },
      { "status": "DISABLE", "count": 5 }
    ],
    "byType": [
      { "type": "PERCENTAGE", "count": 35 },
      { "type": "FIXED", "count": 15 }
    ]
  }
}
```

---

## 👤 Client Endpoints

### 1. Get My Vouchers

**GET** `/client/vouchers/my-vouchers`

**Headers:**

```
Authorization: Bearer {{customer_token}}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "vouchers": [
      {
        "code": "SUMMER2026",
        "name": "Voucher mùa hè",
        "typeDiscount": "PERCENTAGE",
        "value": 20,
        "maxDiscountValue": 500000,
        "minOrderValue": 1000000,
        "endedDate": "2026-08-31T23:59:59.999Z"
      }
    ]
  }
}
```

**Logic:**

1. Query Neo4j for user's unused vouchers
2. Get voucher details from MongoDB
3. Filter by active status and validity

---

### 2. Validate Voucher

**POST** `/client/vouchers/validate`

**Headers:**

```
Authorization: Bearer {{customer_token}}
```

**Request Body:**

```json
{
  "code": "SUMMER2026",
  "orderValue": 5000000
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Voucher hợp lệ!",
  "data": {
    "valid": true,
    "voucher": {
      "code": "SUMMER2026",
      "name": "Voucher mùa hè",
      "typeDiscount": "PERCENTAGE",
      "value": 20,
      "maxDiscountValue": 500000
    },
    "discount": 500000,
    "finalAmount": 4500000
  }
}
```

**Response (Error - No Access):**

```json
{
  "success": false,
  "message": "Bạn không có quyền sử dụng voucher này"
}
```

---

### 3. Get Available Vouchers (Public)

**GET** `/client/vouchers/available`

**No authentication required**

**Response:**

```json
{
  "success": true,
  "data": {
    "vouchers": [
      {
        "code": "WELCOME2026",
        "name": "Voucher chào mừng",
        "typeDiscount": "FIXED",
        "value": 100000,
        "minOrderValue": 500000
      }
    ]
  }
}
```

**Logic:** Only returns vouchers with `applyScope: 'ALL'`

---

## 🔄 Complete Workflow

### Scenario 1: Admin Grants VIP Voucher

```bash
# Step 1: Create SPECIFIC voucher
POST /admin/vouchers
{
  "code": "VIP2026",
  "applyScope": "SPECIFIC",
  ...
}

# Step 2: Grant to VIP customers
POST /admin/vouchers/voucher123/grant
{
  "userIds": ["customer1", "customer2", "customer3"]
}

# Step 3: Check granted users
GET /admin/vouchers/voucher123/users
```

---

### Scenario 2: Customer Uses Voucher

```bash
# Step 1: Customer views their vouchers
GET /client/vouchers/my-vouchers
→ Returns: ["VIP2026", "SUMMER2026"]

# Step 2: Validate before checkout
POST /client/vouchers/validate
{
  "code": "VIP2026",
  "orderValue": 3000000
}
→ Returns: discount = 600,000đ

# Step 3: Create invoice with voucher
POST /client/invoices
{
  "orders": ["order123"],
  "voucher": ["VIP2026"],
  ...
}
→ Voucher marked as used in Neo4j
→ Usage count incremented in MongoDB
```

---

## 📊 Voucher Types

### PERCENTAGE Discount

```json
{
  "typeDiscount": "PERCENTAGE",
  "value": 20,
  "maxDiscountValue": 500000
}
```

**Calculation:**

```
discount = orderValue * 20% = 1,000,000đ
applied = min(1,000,000, 500,000) = 500,000đ
```

### FIXED Discount

```json
{
  "typeDiscount": "FIXED",
  "value": 100000
}
```

**Calculation:**

```
discount = 100,000đ (fixed)
```

---

## ⚠️ Error Handling

| Error             | Message                                  |
| ----------------- | ---------------------------------------- |
| Voucher not found | "Voucher không tồn tại"                  |
| No access         | "Bạn không có quyền sử dụng voucher này" |
| Expired           | "Voucher đã hết hạn"                     |
| Limit reached     | "Voucher đã hết lượt sử dụng"            |
| Order too low     | "Giá trị đơn hàng tối thiểu là Xđ"       |

---

## 🎯 Summary

**Admin Features:**

- ✅ CRUD vouchers
- ✅ Grant/Revoke to specific users
- ✅ View usage statistics
- ✅ Neo4j relationship management

**Client Features:**

- ✅ View personalized vouchers
- ✅ Validate before purchase
- ✅ Auto-apply in invoice

**Technical:**

- ✅ Dual database (MongoDB + Neo4j)
- ✅ Access control via graph relationships
- ✅ Real-time validation
- ✅ Usage tracking
