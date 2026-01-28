# Cart API Documentation (Client)

Tài liệu này mô tả chi tiết các API liên quan đến **giỏ hàng (/cart)** để team Frontend tích hợp.

---

## Tổng quan

* **Base URL**: `/cart`
* **Authentication**: Bắt buộc (Bearer Token)
* Tất cả API đều thao tác trên **giỏ hàng của user hiện tại** (lấy từ access token)

---

## Cart Model (Response)

```ts
Cart {
  _id: string
  owner: string
  products: CartItem[]
  totalProduct: number
  createdAt: string
  updatedAt: string
}

CartItem {
  product?: {
    product_id: string
    sku: string
  }
  lens?: {
    lens_id: string
    sku: string
    parameters: LensParameters
  }
  quantity: number
  addAt: string
}

LensParameters {
  left: {
    SPH: number
    CYL: number
    AXIS: number
  }
  right: {
    SPH: number
    CYL: number
    AXIS: number
  }
  PD: number
}
```

---

## 1. Lấy giỏ hàng

**GET** `/cart`

### Response

```json
{
  "message": "Lấy giỏ hàng thành công!",
  "data": {
    "cart": { /* Cart */ }
  }
}
```

### Notes

* Nếu user chưa có cart → trả lỗi `404 Giỏ hàng không tồn tại`

---

## 2. Thêm sản phẩm vào giỏ hàng

**POST** `/cart/add-product`

### Body

```json
{
  "item": {
    "product": {
      "product_id": "string",
      "sku": "string"
    },
    "lens": {
      "lens_id": "string",
      "sku": "string",
      "parameters": { /* LensParameters */ }
    }
  },
  "quantity": 1
}
```

### Rules

* `product` hoặc `lens` **ít nhất 1 trong 2 phải tồn tại**
* nếu cái nào không tồn tại sẽ không truyền lên
* `quantity >= 1`
* Nếu item đã tồn tại trong cart → **tăng số lượng**
* Nếu chưa tồn tại → **thêm mới**

### Response

```json
{
  "message": "Thêm sản phẩm vào giỏ hàng thành công!",
  "data": null
}
```

---

## 3. Cập nhật số lượng sản phẩm

**PATCH** `/cart/update-quantity`

### Body

```json
{
  "item": {
    "product": {
      "product_id": "string",
      "sku": "string"
    },
    "lens": {
      "lens_id": "string",
      "sku": "string"
    }
  },
  "quantity": 2
}
```

### Rules

* `item` có thể chứa `product`, `lens` hoặc **cả hai** (đúng theo data đã add)
* Item phải tồn tại trong cart
* `quantity >= 1`

### Response

```json
{
  "message": "Cập nhật số lượng thành công!",
  "data": null
}
```

---

## 4. Cập nhật đơn kính (Prescription)

**PATCH** `/cart/update-prescription`

### Body

```json
{
  "item": {
    "product": {
      "product_id": "string",
      "sku": "string"
    },
    "lens": {
      "lens_id": "string",
      "sku": "string"
    }
  },
  "parameters": {
    "left": {
      "SPH": 0,
      "CYL": 0,
      "AXIS": 0
    },
    "right": {
      "SPH": 0,
      "CYL": 0,
      "AXIS": 0
    },
    "PD": 62
  }
}
```

### Rules

* `item` phải **match đúng cấu trúc đã add vào cart** (product + lens nếu có)
* Prescription chỉ được update cho item có `lens`
* Item phải tồn tại trong cart

### Response

```json
{
  "message": "Cập nhật số lượng thành công!",
  "data": null
}
```

---

## 5. Xóa sản phẩm khỏi giỏ hàng

**DELETE** `/cart/remove-product`

### Body

```json
{
  "item": {
    "product": {
      "product_id": "string",
      "sku": "string"
    },
    "lens": {
      "lens_id": "string",
      "sku": "string"
    }
  }
}
```

### Rules

* `item` có thể gồm `product`, `lens` hoặc cả hai
* Cấu trúc item phải **giống lúc add vào cart**
* Item phải tồn tại trong cart

### Response

```json
{
  "message": "Xóa sản phẩm khỏi giỏ hàng thành công!",
  "data": null
}
```

---

## 6. Xóa toàn bộ giỏ hàng

**DELETE** `/cart/clear`

### Response

```json
{
  "message": "Xóa toàn bộ giỏ hàng thành công!",
  "data": null
}
```

---

## Error Format (Common)

```json
{
  "message": "Giỏ hàng không tồn tại!",
}
```

---

## Ghi chú cho FE

* Backend **không trả cart mới** sau khi add/update/remove → FE nên **gọi lại GET /cart** để sync state
* Hiện tại **chưa check stock** khi add/update quantity
* Item được định danh bằng cặp `(product | lens) + sku`

---

