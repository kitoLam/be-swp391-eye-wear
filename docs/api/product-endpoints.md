# Product API - Complete Reference (Updated)

**Base URL:** `http://localhost:5000/api/v1`

---

## 🌐 Public Endpoints (No Authentication Required)

### 1. Get Product List (Public)

**Method:** `GET`  
**URL:** `/api/v1/products`

#### Headers

```
(No authentication required)
```

#### Query Parameters

| Parameter | Type   | Required | Description                                    | Example    |
| --------- | ------ | -------- | ---------------------------------------------- | ---------- |
| `page`    | number | No       | Page number (default: 1)                       | `1`        |
| `limit`   | number | No       | Items per page (default: 10, max: 50)          | `10`       |
| `type`    | string | No       | Filter by type: `frame`, `lens`, or `sunglass` | `sunglass` |
| `brand`   | string | No       | Filter by brand name                           | `Ray-Ban`  |
| `search`  | string | No       | Search by name                                 | `aviator`  |

#### Example URLs

```
GET /api/v1/products
GET /api/v1/products?page=1&limit=20
GET /api/v1/products?type=sunglass&brand=Ray-Ban
GET /api/v1/products?search=aviator
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Lấy danh sách sản phẩm thành công!",
    "data": {
        "productList": [
            {
                "id": "507f1f77bcf86cd799439011",
                "nameBase": "Ray-Ban Wayfarer Sunglass",
                "slugBase": "ray-ban-wayfarer-sunglass",
                "skuBase": "RB-WAY-001",
                "type": "sunglass",
                "brand": "Ray-Ban",
                "categories": ["6965c4bc979f1a2fb5e32801"],
                "defaultVariantPrice": 6000000,
                "defaultVariantFinalPrice": 5400000,
                "defaultVariantImage": "https://example.com/img1.jpg",
                "totalVariants": 2,
                "createdAt": "17/01/2026 22:00"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 1,
            "totalPages": 1
        }
    }
}
```

---

### 2. Get Product Detail (Public)

**Method:** `GET`  
**URL:** `/api/v1/products/:id`

#### Headers

```
(No authentication required)
```

#### Path Parameters

| Parameter | Type   | Required | Description              | Example                    |
| --------- | ------ | -------- | ------------------------ | -------------------------- |
| `id`      | string | Yes      | Product MongoDB ObjectId | `507f1f77bcf86cd799439011` |

#### Example URLs

```
GET /api/v1/products/507f1f77bcf86cd799439011
GET /api/v1/products/{{product_id}}
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Láy sản phẩm thành công!",
    "data": {
        "product": {
            "nameBase": "Ray-Ban Wayfarer Sunglass",
            "slugBase": "ray-ban-wayfarer-sunglass",
            "skuBase": "RB-WAY-001",
            "type": "sunglass",
            "brand": "Ray-Ban",
            "categories": ["6965c4bc979f1a2fb5e32801"],
            "spec": {
                "material": "acetate",
                "shape": "wayfarer",
                "gender": "unisex"
            },
            "variants": [
                {
                    "sku": "RB-WAY-001-BLK",
                    "name": "Ray-Ban Wayfarer Black",
                    "slug": "ray-ban-wayfarer-black",
                    "options": [
                        {
                            "attributeId": "color-001",
                            "attributeName": "Color",
                            "label": "Black",
                            "showType": "color",
                            "value": "#000000"
                        }
                    ],
                    "price": 6000000,
                    "finalPrice": 5400000,
                    "stock": 30,
                    "imgs": ["https://example.com/img1.jpg"],
                    "isDefault": true
                }
            ]
        }
    }
}
```

---

## 🔐 Admin Endpoints (Authentication Required)

All admin endpoints require:

```
Authorization: Bearer {{admin_token}}
```

### 3. Create Product (Admin)

**Method:** `POST`  
**URL:** `/api/v1/admin/products`

#### Headers

```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

> **🎯 Auto-generation Feature:**  
> The system automatically generates `slugBase`, `skuBase`, and variant `sku`, `name`, `slug` fields.  
> You only need to provide `nameBase` and variant `options`!

#### Request Body - Frame

```json
{
    "nameBase": "Gong Kinh Titan Premium",
    "type": "frame",
    "brand": "Premium Brand",
    "categories": ["6965c4bc979f1a2fb5e32801"],
    "spec": {
        "material": "titanium",
        "shape": "round",
        "gender": "male"
    },
    "variants": [
        {
            "options": [
                {
                    "attributeId": "color-001",
                    "attributeName": "Color",
                    "label": "Gold",
                    "showType": "color",
                    "value": "Gold"
                },
                {
                    "attributeId": "size-001",
                    "attributeName": "Size",
                    "label": "Medium",
                    "showType": "text",
                    "value": "Medium"
                }
            ],
            "price": 8000000,
            "finalPrice": 7200000,
            "stock": 20,
            "imgs": ["https://example.com/img1.jpg"],
            "isDefault": true
        }
    ]
}
```

**Auto-generated values:**

```json
{
    "slugBase": "gong-kinh-titan-premium-A1B2C3D4",
    "skuBase": "FR-GKTP-A1B2C3D4",
    "variants": [
        {
            "sku": "FR-GKTP-A1B2C3D4-C-GLD-S-M",
            "name": "Gong Kinh Titan Premium - Gold - Medium",
            "slug": "gong-kinh-titan-premium-gold-medium"
        }
    ]
}
```

#### Request Body - Sunglass

```json
{
    "nameBase": "Ray-Ban Wayfarer Classic",
    "type": "sunglass",
    "brand": "Ray-Ban",
    "categories": ["6965c4bc979f1a2fb5e32801"],
    "spec": {
        "material": "acetate",
        "shape": "wayfarer",
        "gender": "unisex"
    },
    "variants": [
        {
            "options": [
                {
                    "attributeId": "color-001",
                    "attributeName": "Color",
                    "label": "Black",
                    "showType": "color",
                    "value": "Black"
                }
            ],
            "price": 6000000,
            "finalPrice": 5400000,
            "stock": 30,
            "imgs": ["https://example.com/img1.jpg"],
            "isDefault": true
        },
        {
            "options": [
                {
                    "attributeId": "color-001",
                    "attributeName": "Color",
                    "label": "Tortoise",
                    "showType": "color",
                    "value": "Tortoise"
                }
            ],
            "price": 6000000,
            "finalPrice": 5400000,
            "stock": 25,
            "imgs": ["https://example.com/img2.jpg"],
            "isDefault": false
        }
    ]
}
```

**Auto-generated values:**

```json
{
    "slugBase": "ray-ban-wayfarer-classic-X7Y8Z9W0",
    "skuBase": "SG-RBWC-X7Y8Z9W0",
    "variants": [
        {
            "sku": "SG-RBWC-X7Y8Z9W0-C-BLK",
            "name": "Ray-Ban Wayfarer Classic - Black",
            "slug": "ray-ban-wayfarer-classic-black"
        },
        {
            "sku": "SG-RBWC-X7Y8Z9W0-C-TRT",
            "name": "Ray-Ban Wayfarer Classic - Tortoise",
            "slug": "ray-ban-wayfarer-classic-tortoise"
        }
    ]
}
```

#### Request Body - Lens

```json
{
    "nameBase": "Essilor Varilux Progressive",
    "type": "lens",
    "brand": "Essilor",
    "categories": ["6965c4bc979f1a2fb5e32801"],
    "spec": {
        "feature": "progressive"
    },
    "variants": [
        {
            "options": [
                {
                    "attributeId": "thickness-001",
                    "attributeName": "Thickness",
                    "label": "1.56",
                    "showType": "text",
                    "value": "1.56"
                }
            ],
            "price": 3000000,
            "finalPrice": 2700000,
            "stock": 100,
            "imgs": [],
            "isDefault": true
        }
    ]
}
```

**Auto-generated values:**

```json
{
    "slugBase": "essilor-varilux-progressive-P9Q8R7S6",
    "skuBase": "LE-EVP-P9Q8R7S6",
    "variants": [
        {
            "sku": "LE-EVP-P9Q8R7S6-T-156",
            "name": "Essilor Varilux Progressive - 1.56",
            "slug": "essilor-varilux-progressive-156"
        }
    ]
}
```

#### SKU Generation Rules

| Component         | Format                     | Example                          |
| ----------------- | -------------------------- | -------------------------------- |
| **Type Prefix**   | FR/LE/SG                   | `FR` (Frame)                     |
| **Name Initials** | First letters of each word | `GKTP` (Gong Kinh Titan Premium) |
| **UUID**          | 8-character unique ID      | `A1B2C3D4`                       |
| **Full SKU**      | `{TYPE}-{INITIALS}-{UUID}` | `FR-GKTP-A1B2C3D4`               |
| **Variant SKU**   | `{PARENT}-{OPTION_CODES}`  | `FR-GKTP-A1B2C3D4-C-GLD-S-M`     |

#### Color Codes

| Color    | Code | Color  | Code |
| -------- | ---- | ------ | ---- |
| Black    | BLK  | Gold   | GLD  |
| White    | WHT  | Silver | SLV  |
| Red      | RED  | Brown  | BRN  |
| Blue     | BLU  | Gray   | GRY  |
| Green    | GRN  | Pink   | PNK  |
| Yellow   | YEL  | Purple | PRP  |
| Tortoise | TRT  | Orange | ORG  |

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Tạo sản phẩm thành công!",
    "data": {}
}
```

---

### 4. Get Product List (Admin)

**Method:** `GET`  
**URL:** `/api/v1/admin/products`

#### Headers

```
Authorization: Bearer {{admin_token}}
```

#### Query Parameters

Same as public endpoint

#### Example URLs

```
GET /api/v1/admin/products?page=1&limit=10
GET /api/v1/admin/products?type=sunglass&brand=Oakley
```

#### Response

Same as public endpoint

---

### 5. Search by Name/Slug (Admin)

**Method:** `GET`  
**URL:** `/api/v1/admin/products/search/name-slug`

#### Headers

```
Authorization: Bearer {{admin_token}}
```

#### Query Parameters

| Parameter | Type   | Required | Description                  | Example    |
| --------- | ------ | -------- | ---------------------------- | ---------- |
| `search`  | string | Yes      | Search term                  | `wayfarer` |
| `page`    | number | No       | Page number (default: 1)     | `1`        |
| `limit`   | number | No       | Items per page (default: 10) | `10`       |

#### Example URLs

```
GET /api/v1/admin/products/search/name-slug?search=wayfarer
GET /api/v1/admin/products/search/name-slug?search=sunglass&page=1&limit=20
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Tìm kiếm sản phẩm thành công!",
  "data": {
    "productList": [...],
    "pagination": {...}
  }
}
```

---

### 6. Search by SKU (Admin)

**Method:** `GET`  
**URL:** `/api/v1/admin/products/search/sku/:sku`

#### Headers

```
Authorization: Bearer {{admin_token}}
```

#### Path Parameters

| Parameter | Type   | Required | Description      | Example      |
| --------- | ------ | -------- | ---------------- | ------------ |
| `sku`     | string | Yes      | Product SKU code | `RB-WAY-001` |

#### Example URLs

```
GET /api/v1/admin/products/search/sku/RB-WAY-001
GET /api/v1/admin/products/search/sku/OAKLEY-HOLBROOK-001
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Tìm kiếm sản phẩm thành công!",
  "data": {
    "product": {
      "nameBase": "Ray-Ban Wayfarer Sunglass",
      "slugBase": "ray-ban-wayfarer-sunglass",
      "skuBase": "RB-WAY-001",
      "type": "sunglass",
      ...
    }
  }
}
```

---

### 7. Get Product Detail (Admin)

**Method:** `GET`  
**URL:** `/api/v1/admin/products/:id`

#### Headers

```
Authorization: Bearer {{admin_token}}
```

#### Path Parameters

| Parameter | Type   | Required | Description              | Example                    |
| --------- | ------ | -------- | ------------------------ | -------------------------- |
| `id`      | string | Yes      | Product MongoDB ObjectId | `507f1f77bcf86cd799439011` |

#### Response

Same as public endpoint

---

### 8. Update Product (Admin)

**Method:** `PATCH`  
**URL:** `/api/v1/admin/products/:id`

#### Headers

```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

#### Path Parameters

| Parameter | Type   | Required | Description              | Example                    |
| --------- | ------ | -------- | ------------------------ | -------------------------- |
| `id`      | string | Yes      | Product MongoDB ObjectId | `507f1f77bcf86cd799439011` |

#### Request Body (Partial Update)

```json
{
    "nameBase": "Ray-Ban Wayfarer Sunglass Updated",
    "brand": "Ray-Ban Official"
}
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Cập nhật sản phẩm thành công!",
    "data": {}
}
```

---

### 9. Get Statistics (Admin)

**Method:** `GET`  
**URL:** `/api/v1/admin/products/statistics`

#### Headers

```
Authorization: Bearer {{admin_token}}
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Lấy danh sách sản phẩm thành công!",
    "data": {
        "statistics": {
            "total": 15,
            "byType": [
                { "type": "frame", "count": 7 },
                { "type": "sunglass", "count": 5 },
                { "type": "lens", "count": 3 }
            ],
            "byBrand": [
                { "brand": "Ray-Ban", "count": 8 },
                { "brand": "Oakley", "count": 4 }
            ]
        }
    }
}
```

---

### 10. Delete Product (Admin)

**Method:** `DELETE`  
**URL:** `/api/v1/admin/products/:id`

#### Headers

```
Authorization: Bearer {{admin_token}}
```

#### Path Parameters

| Parameter | Type   | Required | Description              | Example                    |
| --------- | ------ | -------- | ------------------------ | -------------------------- |
| `id`      | string | Yes      | Product MongoDB ObjectId | `507f1f77bcf86cd799439011` |

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Xóa sản phẩm thành công!",
    "data": {}
}
```

---

## 📊 Complete Endpoint Summary

| #   | Method | Endpoint                           | Auth   | Type   | Description         |
| --- | ------ | ---------------------------------- | ------ | ------ | ------------------- |
| 1   | GET    | `/products`                        | ❌ No  | Public | Get product list    |
| 2   | GET    | `/products/:id`                    | ❌ No  | Public | Get product detail  |
| 3   | POST   | `/admin/products`                  | ✅ Yes | Admin  | Create product      |
| 4   | GET    | `/admin/products`                  | ✅ Yes | Admin  | Get product list    |
| 5   | GET    | `/admin/products/search/name-slug` | ✅ Yes | Admin  | Search by name/slug |
| 6   | GET    | `/admin/products/search/sku/:sku`  | ✅ Yes | Admin  | Search by SKU       |
| 7   | GET    | `/admin/products/:id`              | ✅ Yes | Admin  | Get product detail  |
| 8   | PATCH  | `/admin/products/:id`              | ✅ Yes | Admin  | Update product      |
| 9   | GET    | `/admin/products/statistics`       | ✅ Yes | Admin  | Get statistics      |
| 10  | DELETE | `/admin/products/:id`              | ✅ Yes | Admin  | Delete product      |

---

## 🆕 Product Types

| Type       | Spec Structure                      | Description       | Example                        |
| ---------- | ----------------------------------- | ----------------- | ------------------------------ |
| `frame`    | FrameSpec (material, shape, gender) | Gọng kính thường  | Gọng kính cận                  |
| `sunglass` | FrameSpec (material, shape, gender) | Kính râm/kính mát | Ray-Ban Wayfarer               |
| `lens`     | LensSpec (feature)                  | Tròng kính        | Tròng kính chống ánh sáng xanh |

---

## 🔑 Key Differences

### Public vs Admin Endpoints

| Feature                  | Public Endpoints   | Admin Endpoints          |
| ------------------------ | ------------------ | ------------------------ |
| **Authentication**       | ❌ Not required    | ✅ Required              |
| **Base Path**            | `/api/v1/products` | `/api/v1/admin/products` |
| **Available Operations** | Read only (GET)    | Full CRUD + Search       |
| **Use Case**             | Customer browsing  | Product management       |

### When to Use Which?

**Use Public Endpoints when:**

- Customer browsing products
- Product catalog display
- SEO/crawlers
- No authentication available

**Use Admin Endpoints when:**

- Managing products (CRUD)
- Searching products for admin panel
- Getting statistics
- Authenticated admin operations

---

## 🎯 Testing Order

### Public Endpoints (No Auth)

1. **GET /products** → Browse catalog
2. **GET /products/:id** → View product details

### Admin Endpoints (With Auth)

3. **POST /admin/products** → Create sunglass product
4. **GET /admin/products?type=sunglass** → Filter sunglasses
5. **GET /admin/products/search/name-slug?search=wayfarer** → Search
6. **GET /admin/products/search/sku/RB-WAY-001** → Find by SKU
7. **GET /admin/products/:id** → Get details
8. **PATCH /admin/products/:id** → Update
9. **GET /admin/products/statistics** → View stats
10. **DELETE /admin/products/:id** → Delete

---

## 💡 Examples

### Create Sunglass Product

```bash
curl -X POST http://localhost:5000/api/v1/admin/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sunglass",
    "nameBase": "Oakley Holbrook Sunglass",
    "slugBase": "oakley-holbrook-sunglass",
    "skuBase": "OAK-HOL-001",
    "brand": "Oakley",
    "categories": ["6965c4bc979f1a2fb5e32801"],
    "spec": {
      "material": "plastic",
      "shape": "square",
      "gender": "male"
    },
    "variants": [...]
  }'
```

### Get Sunglasses (Public - No Auth)

```bash
curl http://localhost:5000/api/v1/products?type=sunglass
```

### Get Sunglasses (Admin - With Auth)

```bash
curl http://localhost:5000/api/v1/admin/products?type=sunglass \
  -H "Authorization: Bearer YOUR_TOKEN"
```
