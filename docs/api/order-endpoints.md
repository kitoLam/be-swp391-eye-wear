# Order API - Complete Reference

**Base URL:** `http://localhost:5000/api/v1/client`

---

## 📋 Order Endpoints

### 1. Create Order (Auto-Detect Type)

**Method:** `POST`  
**URL:** `/api/v1/client/orders`

Hệ thống sẽ **tự động xác định** loại đơn hàng (`NORMAL` hoặc `MANUFACTURING`) dựa trên sản phẩm trong giỏ.

- **NORMAL**: Đơn hàng chỉ gồm sản phẩm bán sẵn (Gọng, Kính râm) và KHÔNG có cấu hình tròng kính.
- **MANUFACTURING**: Đơn hàng có ít nhất 1 sản phẩm kèm cấu hình tròng kính (`lens` config).

#### Headers

```
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

---

#### 📦 Scenario A: Mua Gọng/Kính Râm Lẻ (NORMAL)

Khách hàng chỉ mua gọng kính hoặc kính râm, không cắt kính.

**Request Body:**

```json
{
  "products": [
    {
      "product_id": "FR-GUCCI-001",
      "quantity": 1
      // ❌ Không gửi field "lens"
    },
    {
      "product_id": "SG-RAYBAN-002",
      "quantity": 2
    }
  ],
  "price": 5000000,
  "note": "Giao giờ hành chính"
}
```

**System Logic:**

1.  Check items: Không có item nào có `lens`.
2.  **Order Type**: `NORMAL`.
3.  **Verification**: `APPROVE` (Auto).

---

#### 🛠️ Scenario B: Cắt Kính (MANUFACTURING)

Khách hàng mua gọng và yêu cầu cắt tròng kính.

**Request Body:**

```json
{
  "products": [
    {
      "product_id": "FR-GUCCI-001",
      "quantity": 1,
      "lens": {
        "lens_id": "LE-ESSILOR-05",
        "quantity": 1,
        "parameters": {
          "left": {
            "SPH": -2.5,
            "CYL": -0.75,
            "AXIS": 180
          },
          "right": {
            "SPH": -3.0,
            "CYL": -0.5,
            "AXIS": 90
          },
          "PD": 62
        }
      }
    }
  ],
  "price": 3500000,
  "note": "Cắt kỹ giúp em"
}
```

**System Logic:**

1.  Check items: Có item chứa `lens`.
2.  **Order Type**: `MANUFACTURING`.
3.  **Verification**: `PENDING` (Chờ nhân viên duyệt độ).
4.  **Assignment**: `PENDING` (Chờ giao việc cho kỹ thuật viên).

---

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Tạo đơn hàng thành công!",
  "data": {
    "order": {
      "_id": "order123",
      "type": "MANUFACTURING", // Auto-detected
      "products": [...],
      "isVerified": {
        "status": "PENDING"
      },
      "assignment": {
        "status": "PENDING"
      },
      "price": 3500000,
      "createdAt": "2026-01-18T05:00:00.000Z"
    }
  }
}
```

---

## ⚠️ Notes

1.  **Price**: Hiện tại client gửi giá tạm tính. Backend nên validate lại giá này service (Future improvement).
2.  **Product ID**: Dùng SKU hoặc ID của Product Variant.
3.  **Payment**: Flow thanh toán sẽ thực hiện sau khi tạo đơn (chưa cover ở endpoint này).
