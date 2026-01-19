# Cart API - Complete Reference

**Base URL:** `http://localhost:5000/api/v1/client`

**Authentication:** Required (Customer token)

---

## 📋 Cart Endpoints

All cart endpoints require customer authentication.

### Headers (All Endpoints)

```
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

---

## 1. Get Cart

**Method:** `GET`  
**URL:** `/api/v1/client/cart`

### Description

Lấy giỏ hàng hiện tại của customer đang login.

### Headers

```
Authorization: Bearer {{customer_token}}
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy giỏ hàng thành công!",
  "data": {
    "cart": {
      "_id": "cart123",
      "owner": "customer123",
      "products": [
        {
          "product_id": "FR-GKTP-A1B2C3D4-C-GLD-S-M",
          "quantity": 2,
          "addAt": "2026-01-18T00:00:00.000Z"
        },
        {
          "product_id": "SG-RBWC-X7Y8Z9W0-C-BLK",
          "quantity": 1,
          "addAt": "2026-01-18T00:05:00.000Z"
        }
      ],
      "totalProduct": 3,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-18T00:05:00.000Z"
    }
  }
}
```

### Response (404 Not Found) - Cart doesn't exist

```json
{
  "success": false,
  "message": "Giỏ hàng không tồn tại!"
}
```

---

## 2. Add to Cart

**Method:** `POST`  
**URL:** `/api/v1/client/cart/add`

### Description

Thêm sản phẩm vào giỏ hàng. Nếu sản phẩm đã tồn tại, tăng số lượng.

### Headers

```
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

### Request Body

```json
{
  "product_id": "FR-GKTP-A1B2C3D4-C-GLD-S-M",
  "quantity": 2
}
```

### Field Descriptions

| Field        | Type   | Required | Description                      |
| ------------ | ------ | -------- | -------------------------------- |
| `product_id` | string | Yes      | Variant SKU (auto-generated SKU) |
| `quantity`   | number | Yes      | Số lượng (≥ 1)                   |

### Response (200 OK)

```json
{
  "success": true,
  "message": "Thêm sản phẩm vào giỏ hàng thành công!",
  "data": {
    "cart": {
      "_id": "cart123",
      "owner": "customer123",
      "products": [
        {
          "product_id": "FR-GKTP-A1B2C3D4-C-GLD-S-M",
          "quantity": 2,
          "addAt": "2026-01-18T00:00:00.000Z"
        }
      ],
      "totalProduct": 2
    }
  }
}
```

### Response (400 Bad Request) - Validation Error

```json
{
  "success": false,
  "message": "Quantity must be at least 1"
}
```

---

## 3. Update Cart Item Quantity

**Method:** `PATCH`  
**URL:** `/api/v1/client/cart/update`

### Description

Cập nhật số lượng của một sản phẩm trong giỏ hàng.

### Headers

```
Authorization: Bearer {{customer_token}}
Content-Type: application/json
```

### Request Body

```json
{
  "product_id": "FR-GKTP-A1B2C3D4-C-GLD-S-M",
  "quantity": 5
}
```

### Field Descriptions

| Field        | Type   | Required | Description        |
| ------------ | ------ | -------- | ------------------ |
| `product_id` | string | Yes      | Variant SKU        |
| `quantity`   | number | Yes      | Số lượng mới (≥ 1) |

### Response (200 OK)

```json
{
  "success": true,
  "message": "Cập nhật số lượng thành công!",
  "data": {
    "cart": {
      "_id": "cart123",
      "owner": "customer123",
      "products": [
        {
          "product_id": "FR-GKTP-A1B2C3D4-C-GLD-S-M",
          "quantity": 5,
          "addAt": "2026-01-18T00:00:00.000Z"
        }
      ],
      "totalProduct": 5
    }
  }
}
```

### Response (404 Not Found) - Product not in cart

```json
{
  "success": false,
  "message": "Sản phẩm không có trong giỏ hàng!"
}
```

---

## 4. Remove Item from Cart

**Method:** `DELETE`  
**URL:** `/api/v1/client/cart/remove/:product_id`

### Description

Xóa một sản phẩm khỏi giỏ hàng.

### Headers

```
Authorization: Bearer {{customer_token}}
```

### Path Parameters

| Parameter    | Type   | Required | Description         |
| ------------ | ------ | -------- | ------------------- |
| `product_id` | string | Yes      | Variant SKU cần xóa |

### Example URLs

```
DELETE /api/v1/client/cart/remove/FR-GKTP-A1B2C3D4-C-GLD-S-M
DELETE /api/v1/client/cart/remove/{{product_id}}
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Xóa sản phẩm khỏi giỏ hàng thành công!",
  "data": {
    "cart": {
      "_id": "cart123",
      "owner": "customer123",
      "products": [],
      "totalProduct": 0
    }
  }
}
```

---

## 5. Clear Cart

**Method:** `DELETE`  
**URL:** `/api/v1/client/cart/clear`

### Description

Xóa tất cả sản phẩm trong giỏ hàng.

### Headers

```
Authorization: Bearer {{customer_token}}
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Xóa toàn bộ giỏ hàng thành công!",
  "data": {
    "cart": {
      "_id": "cart123",
      "owner": "customer123",
      "products": [],
      "totalProduct": 0
    }
  }
}
```

---

## 📊 Endpoint Summary

| #   | Method | Endpoint                          | Description     |
| --- | ------ | --------------------------------- | --------------- |
| 1   | GET    | `/client/cart`                    | Get cart        |
| 2   | POST   | `/client/cart/add`                | Add to cart     |
| 3   | PATCH  | `/client/cart/update`             | Update quantity |
| 4   | DELETE | `/client/cart/remove/:product_id` | Remove item     |
| 5   | DELETE | `/client/cart/clear`              | Clear cart      |

---

## 🎯 Testing Flow

### 1. Login Customer

```bash
POST /api/v1/client/auth/login
{
  "email": "customer@example.com",
  "password": "password123"
}
```

→ Save `customer_token`

### 2. Get Cart (Initially Empty)

```bash
GET /api/v1/client/cart
Authorization: Bearer {{customer_token}}
```

### 3. Add Product to Cart

```bash
POST /api/v1/client/cart/add
Authorization: Bearer {{customer_token}}
{
  "product_id": "FR-GKTP-A1B2C3D4-C-GLD-S-M",
  "quantity": 2
}
```

### 4. Add Another Product

```bash
POST /api/v1/client/cart/add
{
  "product_id": "SG-RBWC-X7Y8Z9W0-C-BLK",
  "quantity": 1
}
```

### 5. Update Quantity

```bash
PATCH /api/v1/client/cart/update
{
  "product_id": "FR-GKTP-A1B2C3D4-C-GLD-S-M",
  "quantity": 5
}
```

### 6. Get Cart (See Changes)

```bash
GET /api/v1/client/cart
```

### 7. Remove One Item

```bash
DELETE /api/v1/client/cart/remove/SG-RBWC-X7Y8Z9W0-C-BLK
```

### 8. Clear Cart

```bash
DELETE /api/v1/client/cart/clear
```

---

## 💡 Important Notes

### Product ID Format

- Sử dụng **Variant SKU** (auto-generated)
- Format: `{TYPE}-{INITIALS}-{UUID}-{OPTION_CODES}`
- Example: `FR-GKTP-A1B2C3D4-C-GLD-S-M`

### Cart Behavior

- **Auto-create**: Cart tự động tạo khi customer đăng ký
- **Unique products**: Không thể thêm duplicate product_id
- **Quantity update**: Nếu product đã tồn tại, add sẽ cộng dồn quantity
- **Total calculation**: `totalProduct` tự động tính từ sum của quantities

### Authentication

- Tất cả endpoints cần customer token
- Token lấy từ login response
- Owner ID tự động lấy từ token (không cần gửi trong body)

---

## 🔄 Postman Collection Setup

### Environment Variables

```
customer_token: (auto-filled from login)
product_id: (manual or auto-filled)
```

### Login Script (Save Token)

```javascript
const response = pm.response.json();
if (response.success && response.data && response.data.accessToken) {
  pm.environment.set("customer_token", response.data.accessToken);
  console.log("✅ Customer token saved");
}
```

### Collection Authorization

- Type: `Bearer Token`
- Token: `{{customer_token}}`

---

## 🚨 Error Handling

### Common Errors

**401 Unauthorized**

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

→ Token missing or invalid

**404 Not Found**

```json
{
  "success": false,
  "message": "Giỏ hàng không tồn tại!"
}
```

→ Cart doesn't exist for customer

**400 Bad Request**

```json
{
  "success": false,
  "message": "Quantity must be at least 1"
}
```

→ Validation error

**409 Conflict**

```json
{
  "success": false,
  "message": "Cannot add duplicate products to cart"
}
```

→ Trying to add duplicate product (should use update instead)
