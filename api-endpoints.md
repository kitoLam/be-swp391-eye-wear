# API Endpoint Documentation

Tài liệu này được tổng hợp **từ source code hiện tại** (routes + controllers + schema validate bằng Zod + service/converter/repository/model).

## Base URL (mount từ `src/app.ts`)

-   **Admin API**: `/api/${API_VERSION}/admin`
-   **Client API**: `/api/${API_VERSION}/` (**lưu ý**: `systemConstant.prefixPathClient = ""` nên không có `/client`)
-   **Common/Public API**: `/api/${API_VERSION}`

Mặc định `API_VERSION = v1` (`config.apiVersion`).

## Response format chung

Theo `src/utils/api-response.ts`:

```json
{
    "success": true,
    "message": "...",
    "data": {}
}
```

---

# Admin API

Prefix: `/api/v1/admin`

## 1) Auth (`/auth`)

### 1.1 POST `/auth/login`

-   **Auth**: Không
-   **Headers**:
    -   `x-device-id`: `string | undefined` (được đọc trong controller)
-   **Body** (`src/types/auth/admin/auth.ts`):

```json
{
    "email": "string (email)",
    "password": "string (min 8)"
}
```

-   **Response** (`src/controllers/admin/auth.controller.ts`):

```json
{
    "success": true,
    "message": "<authMessage.success.login>",
    "data": {
        "accessToken": "string"
    }
}
```

-   **Side effect**: set cookie `refreshToken` (httpOnly)

### 1.2 POST `/auth/logout`

-   **Auth**: Có (`authenticateMiddleware`)
-   **Body**: none
-   **Response**:

```json
{
    "success": true,
    "message": "Logout successfully",
    "data": null
}
```

-   **Side effect**: clear cookie `refreshToken`

### 1.3 POST `/auth/refresh-token`

-   **Auth**: Có (`verifyRefreshTokenMiddleware`)
-   **Headers**:
    -   `x-device-id`: `string` (**bắt buộc**)
-   **Cookies**:
    -   `refreshToken`: `string` (**bắt buộc**)
-   **Body**: none
-   **Response**:

```json
{
    "success": true,
    "message": "Get new refresh token successfully",
    "data": {
        "accessToken": "string"
    }
}
```

---

## 2) Attributes (`/attributes`)

### 2.1 GET `/attributes`

-   **Auth**: Có
-   **Query** (`src/types/attribute/attribute.query.ts`):

```json
{
    "page": "number (>=1, default 1)",
    "limit": "number (1..50, default 10)"
}
```

-   **Response** (`attributeService.getAttributeList`):

```json
{
    "success": true,
    "message": "<attributeMessage.success.list>",
    "data": {
        "attributeList": [
            {
                "id": "string",
                "name": "string",
                "showType": "color|text",
                "createdAt": "string (formatted)"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 0,
            "totalPages": 0
        }
    }
}
```

### 2.2 POST `/attributes`

-   **Auth**: Có
-   **Body** (`AttributeCreateSchema`):

```json
{
    "name": "string (1..255)",
    "showType": "color|text"
}
```

-   **Response**:

```json
{
    "success": true,
    "message": "<attributeMessage.success.create>",
    "data": {}
}
```

### 2.3 GET `/attributes/:id`

-   **Auth**: Có
-   **Params**: `id` (ObjectId)
-   **Response** (`attributeService.getAttributeDetail` -> `toAttributeCreateDTO`):

```json
{
    "success": true,
    "message": "<attributeMessage.success.detail>",
    "data": {
        "attribute": {
            "name": "string",
            "showType": "color|text"
        }
    }
}
```

### 2.4 PATCH `/attributes/:id`

-   **Auth**: Có
-   **Params**: `id` (ObjectId)
-   **Body** (`AttributeCreateSchema`):

```json
{
    "name": "string (1..255)",
    "showType": "color|text"
}
```

-   **Response**:

```json
{
    "success": true,
    "message": "<attributeMessage.success.update>",
    "data": {}
}
```

### 2.5 DELETE `/attributes/:id`

-   **Auth**: Có
-   **Params**: `id` (ObjectId)
-   **Body**: (route hiện đang validateBody khi delete bằng `AttributeCreateSchema`)

```json
{
    "name": "string (1..255)",
    "showType": "color|text"
}
```

-   **Response**:

```json
{
    "success": true,
    "message": "<attributeMessage.success.update>",
    "data": {}
}
```

---

## 3) Categories (`/categories`)

### 3.1 POST `/categories`

-   **Auth**: Có
-   **Body**: `multipart/form-data` + upload `thumbnail` (field name: `thumbnail`)
-   **Validated Body** (`CreateCategorySchema`):

```json
{
    "name": "string",
    "parentId": "string(ObjectId) | null",
    "thumbnail": "string(url) | '' (optional)"
}
```

-   **Response**:

```json
{
    "success": true,
    "message": "Create category successfully",
    "data": {}
}
```

### 3.2 PATCH `/categories/:id`

-   **Auth**: Có
-   **Params**: `id` (ObjectId)
-   **Body**: `multipart/form-data` + upload `thumbnail`
-   **Validated Body** (`UpdateCategorySchema`):

```json
{
    "name": "string",
    "parentId": "string(ObjectId) | null",
    "thumbnail": "string(url) | '' (optional)"
}
```

-   **Response**:

```json
{
    "success": true,
    "message": "Update category successfully",
    "data": {}
}
```

### 3.3 DELETE `/categories/:id`

-   **Auth**: Có
-   **Params**: `id` (ObjectId)
-   **Response**:

```json
{
    "success": true,
    "message": "Delete category successfully",
    "data": {}
}
```

---

## 4) Customers (`/customers`)

### 4.1 GET `/customers`

-   **Auth**: Có
-   **Query**:
    -   `page?: number` (default 1)
    -   `limit?: number` (default 10)
    -   `search?: string` (default "")
-   **Response** (`admin/customer.service.ts`):

```json
{
    "success": true,
    "message": "Get customer list successfully",
    "data": {
        "items": [
            {
                "_id": "string",
                "name": "string",
                "email": "string",
                "phone": "string",
                "gender": "F|M|N",
                "address": [
                    {
                        "street": "string",
                        "ward": "string",
                        "city": "string"
                    }
                ],
                "hobbies": ["string"],
                "isVerified": true,
                "linkedAccounts": [
                    {
                        "provider": "string",
                        "sub": "string",
                        "email_verified": true,
                        "given_name": "string",
                        "family_name": "string",
                        "picture": "string",
                        "locale": "string",
                        "linkedAt": "string"
                    }
                ],
                "deletedAt": null,
                "deletedBy": "string|null",
                "createdAt": "string",
                "updatedAt": "string"
            }
        ],
        "total": 0,
        "page": 1,
        "limit": 10,
        "pages": 0
    }
}
```

### 4.2 GET `/customers/:id`

-   **Auth**: Có
-   **Params**: `id: string`
-   **Response**:

```json
{
    "success": true,
    "message": "Get customer detail successfully",
    "data": {
        "_id": "string",
        "name": "string",
        "email": "string",
        "phone": "string",
        "gender": "F|M|N",
        "address": [{ "street": "string", "ward": "string", "city": "string" }],
        "hobbies": ["string"],
        "isVerified": true,
        "linkedAccounts": [
            {
                "provider": "string",
                "sub": "string",
                "email_verified": true,
                "given_name": "string",
                "family_name": "string",
                "picture": "string",
                "locale": "string",
                "linkedAt": "string"
            }
        ],
        "deletedAt": null,
        "deletedBy": "string|null",
        "createdAt": "string",
        "updatedAt": "string"
    }
}
```

---

## 5) Invoices (`/invoices`)

### 5.1 GET `/invoices`

-   **Auth**: Có
-   **Query** (`InvoiceListQuerySchema`): `page/limit/search/status` (xem `src/types/invoice/invoice.query.ts`)
-   **Response** (controller có map format):

```json
{
    "success": true,
    "message": "Get invoice list success",
    "data": {
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 0,
            "totalPages": 0
        },
        "invoiceList": [
            {
                "id": "string",
                "invoiceCode": "string",
                "fullName": "string",
                "phone": "string",
                "finalPrice": "string (formatNumberToVND)",
                "status": "string",
                "createdAt": "string (formatDateToString)",
                "address": "string (street, ward, city)"
            }
        ]
    }
}
```

### 5.2) PATCH `/invoices/:id/status/approve`

Approve invoice

### Params

| Field | Type     | Required |
| ----- | -------- | -------- |
| id    | ObjectId | ✅        |

### Response

```json
{
  "success": true,
  "message": "Approve invoice success",
  "data": null
}
```

---

### 5.3) PATCH `/invoices/:id/status/reject`

Reject invoice

### Params

| Field | Type     | Required |
| ----- | -------- | -------- |
| id    | ObjectId | ✅        |

### Response

```json
{
  "success": true,
  "message": "Reject invoice success",
  "data": null
}
```

---

### 5.4) PATCH `/invoices/:id/status/onboard`

Manager onboard invoice (chuyển invoice sang trạng thái xử lý nội bộ)

### Auth

* Required (Admin - MANAGER)

### Params

| Field | Type     | Required |
| ----- | -------- | -------- |
| id    | ObjectId | ✅        |

### Business Rules

* Invoice phải ở trạng thái hợp lệ theo flow (sau approve)
* Chỉ role **MANAGER** được phép thực hiện

### Response

```json
{
  "success": true,
  "message": "Onboard invoice success",
  "data": null
{
  "success": true,
  "message": "Reject invoice success",
  "data": null
}
```


## 6) Orders (`/orders`)

### 6.1 GET `/orders`

-   **Auth**: Có
-   **Query**:
    -   `staffId: string` (**bắt buộc**)
-   **Important**: `orderRepository.find(...)` trả về **PaginatedResult** `{data,total,page,limit,totalPages}` (theo `BaseRepository`).
    -   Hiện controller đang trả `orders` = toàn bộ object paginated, không chỉ array.
-   **Response thực tế** (theo code hiện tại):

```json
{
    "success": true,
    "message": "Lấy danh sách order thành công!",
    "data": {
        "orders": {
            "data": [
                {
                    "_id": "string",
                    "type": ["NORMAL", "MANUFACTURING"],
                    "status": "PENDING|...",
                    "products": [
                        {
                            "product": {
                                "product_id": "string",
                                "sku": "string",
                                "pricePerUnit": 0
                            },
                            "quantity": 1,
                            "lens": {
                                "lens_id": "string",
                                "sku": "string",
                                "parameters": {
                                    "left": { "SPH": 0, "CYL": 0, "AXIS": 0 },
                                    "right": { "SPH": 0, "CYL": 0, "AXIS": 0 },
                                    "PD": 0
                                },
                                "pricePerUnit": 0
                            }
                        }
                    ],
                    "assigneeId": "string|null",
                    "staffId": "string|null",
                    "assignStaff": "string|null",
                    "assignedAt": "string|null",
                    "startedAt": "string|null",
                    "completedAt": "string|null",
                    "assignmentStatus": "PENDING|ASSIGNED|...",
                    "price": 0,
                    "createdAt": "string",
                    "updatedAt": "string",
                    "deletedAt": null
                }
            ],
            "total": 0,
            "page": 1,
            "limit": 10,
            "totalPages": 0
        }
    }
}
```
### 6.2) PATCH `/orders/:id/status/assign`

Manager assign order cho operation staff

### Auth

* Required (Admin - MANAGER)

### Params

| Field | Type     | Required |
| ----- | -------- | -------- |
| id    | ObjectId | ✅        |

### Body

```json
{
  "assignedStaff": "string(ObjectId)"
}
```

### Business Rules

* Order chưa được assign
* assignedStaff phải có role `OPERATION_STAFF`

### Response

```json
{
  "success": true,
  "message": "Assign successfully",
  "data": null
}
```

---

### 6.3) PATCH `/orders/:id/status/making`

Operation staff bắt đầu gia công order

### Conditions

* Order type phải chứa `MANUFACTURING`
* Order được assign cho staff hiện tại

### Response

```json
{
  "success": true,
  "message": "Tag Making successfully",
  "data": null
}
```

---

### 6.4) PATCH `/orders/:id/status/packaging`

Operation staff đóng gói order

### Conditions

* Order được assign cho staff hiện tại

### Response

```json
{
  "success": true,
  "message": "Tag Packaging successfully",
  "data": null
}
```

---

### 6.5) PATCH `/orders/:id/status/complete`

Hoàn thành order

### Side Effect

* Nếu **tất cả order trong invoice đều COMPLETED** → invoice sẽ được set `COMPLETED`

### Response

```json
{
  "success": true,
  "message": "Tag complete successfully",
  "data": null
}
```

---

## 7) Products (`/products`)

### 7.1 GET `/products/search/name-slug`

-   **Auth**: Không
-   **Query**:
    -   `search?: string`
    -   `page?: number` (default 1)
    -   `limit?: number` (default 10)
-   **Response**:

```json
{
    "success": true,
    "message": "<ProductMessage.success.search>",
    "data": {
        "productList": [
            {
                "id": "string",
                "nameBase": "string",
                "slugBase": "string",
                "skuBase": "string",
                "type": "frame|lens|sunglass",
                "brand": "string|null",
                "categories": ["string"],
                "defaultVariantPrice": 0,
                "defaultVariantFinalPrice": 0,
                "defaultVariantImage": "string|undefined",
                "totalVariants": 0,
                "createdAt": "string (formatted)"
            }
        ],
        "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
    }
}
```

### 7.2 GET `/products/search/sku/:sku`

-   **Auth**: Không
-   **Params**: `sku: string`
-   **Response**:

```json
{
    "success": true,
    "message": "<ProductMessage.success.search>",
    "data": {
        "product": {
            "nameBase": "string",
            "slugBase": "string",
            "skuBase": "string",
            "brand": "string|null",
            "categories": ["string"],
            "type": "frame|sunglass|lens",
            "spec": { "...": "FrameSpecSchema | LenSpecSchema" },
            "variants": [
                {
                    "sku": "string",
                    "name": "string",
                    "slug": "string",
                    "options": [
                        {
                            "attributeId": "string",
                            "attributeName": "string",
                            "label": "string",
                            "showType": "string",
                            "value": "string"
                        }
                    ],
                    "price": 0,
                    "finalPrice": 0,
                    "stock": 0,
                    "imgs": ["string"],
                    "isDefault": true
                }
            ]
        }
    }
}
```

### 7.3 GET `/products/statistics`

-   **Auth**: Không
-   **Response**:

```json
{
    "success": true,
    "message": "<ProductMessage.success.getList>",
    "data": {
        "statistics": {
            "total": 0,
            "byType": [{ "type": "string", "count": 0 }],
            "byBrand": [{ "brand": "string", "count": 0 }]
        }
    }
}
```

### 7.4 POST `/products`

-   **Auth**: Có
-   **Body**: `ProductCreateDTO` (`src/types/product/product/product.dto.ts`)
-   **Response**:

```json
{
    "success": true,
    "message": "<ProductMessage.success.create>",
    "data": {}
}
```

### 7.5 GET `/products`

-   **Auth**: Không
-   **Query** (`ProductListQuerySchema`)
-   **Response**:

```json
{
    "success": true,
    "message": "<ProductMessage.success.getList>",
    "data": {
        "productList": [
            {
                "id": "string",
                "nameBase": "string",
                "slugBase": "string",
                "skuBase": "string",
                "type": "frame|lens|sunglass",
                "brand": "string|null",
                "categories": ["string"],
                "defaultVariantPrice": 0,
                "defaultVariantFinalPrice": 0,
                "defaultVariantImage": "string|undefined",
                "totalVariants": 0,
                "createdAt": "string (formatted)"
            }
        ],
        "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
    }
}
```

### 7.6 GET `/products/:id`

-   **Auth**: Không
-   **Params**: `id` (ObjectId)
-   **Response**:

```json
{
    "success": true,
    "message": "<ProductMessage.success.getDetail>",
    "data": {
        "product": {
            "nameBase": "string",
            "slugBase": "string",
            "skuBase": "string",
            "brand": "string|null",
            "categories": ["string"],
            "type": "frame|sunglass|lens",
            "spec": { "...": "FrameSpecSchema | LenSpecSchema" },
            "variants": [
                {
                    "sku": "string",
                    "name": "string",
                    "slug": "string",
                    "options": [
                        {
                            "attributeId": "string",
                            "attributeName": "string",
                            "label": "string",
                            "showType": "string",
                            "value": "string"
                        }
                    ],
                    "price": 0,
                    "finalPrice": 0,
                    "stock": 0,
                    "imgs": ["string"],
                    "isDefault": true
                }
            ]
        }
    }
}
```

### 7.7 PATCH `/products/:id`

-   **Auth**: Có
-   **Params**: `id` (ObjectId)
-   **Body**: `ProductUpdateDTO`
-   **Response**:

```json
{
    "success": true,
    "message": "<ProductMessage.success.update>",
    "data": {}
}
```

### 7.8 DELETE `/products/:id`

-   **Auth**: Có
-   **Params**: `id` (ObjectId)
-   **Response**:

```json
{
    "success": true,
    "message": "<ProductMessage.success.delete>",
    "data": {}
}
```

---

## 8) Vouchers (`/vouchers`)

### 8.1 POST `/vouchers`

-   **Auth**: Có
-   **Body** (`CreateVoucherSchema`)
-   **Response**:

```json
{
    "success": true,
    "message": "Tạo voucher thành công!",
    "data": {
        "voucher": {
            "_id": "string",
            "name": "string",
            "description": "string",
            "code": "string",
            "typeDiscount": "FIXED|PERCENTAGE",
            "value": 0,
            "usageLimit": 0,
            "usageCount": 0,
            "startedDate": "string",
            "endedDate": "string",
            "minOrderValue": 0,
            "maxDiscountValue": 0,
            "applyScope": "ALL|SPECIFIC",
            "status": "DRAFT|ACTIVE|DISABLE",
            "createdAt": "string",
            "updatedAt": "string",
            "deletedAt": null
        }
    }
}
```

### 8.2 GET `/vouchers`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Lấy danh sách voucher thành công!",
    "data": {
        "items": ["Voucher"],
        "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
    }
}
```

### 8.3 GET `/vouchers/statistics`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Lấy thống kê thành công!",
    "data": { "...": "stats" }
}
```

### 8.4 GET `/vouchers/:id`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Lấy chi tiết voucher thành công!",
    "data": { "voucher": { "...": "Voucher" } }
}
```

### 8.5 PATCH `/vouchers/:id`

-   **Auth**: Có
-   **Body** (`UpdateVoucherSchema`)
-   **Response**:

```json
{
    "success": true,
    "message": "Cập nhật voucher thành công!",
    "data": { "voucher": { "...": "Voucher" } }
}
```

### 8.6 DELETE `/vouchers/:id`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Voucher deleted successfully",
    "data": {}
}
```

### 8.7 POST `/vouchers/:id/grant`

-   **Auth**: Có
-   **Body**:

```json
{
    "userIds": ["string"]
}
```

-   **Response**:

```json
{
    "success": true,
    "message": "Đã cấp voucher <voucherCode> cho <grantedCount> users",
    "data": { "voucherCode": "string", "grantedCount": 0 }
}
```

### 8.8 POST `/vouchers/:id/revoke`

-   **Auth**: Có
-   **Body**:

```json
{
    "userIds": ["string"]
}
```

-   **Response**:

```json
{
    "success": true,
    "message": "Đã thu hồi voucher <voucherCode> từ <revokedCount> users",
    "data": { "voucherCode": "string", "revokedCount": 0 }
}
```

### 8.9 GET `/vouchers/:id/users`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Lấy danh sách users thành công!",
    "data": {
        "voucher": { "code": "string", "name": "string" },
        "users": ["string"]
    }
}
```

### 8.10 GET `/vouchers/users/:userId/vouchers`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Lấy danh sách vouchers của user thành công!",
    "data": { "vouchers": ["Voucher"] }
}
```

---

# Client API

Prefix: `/api/v1/`

## 1) Auth (`/auth`)

### 1.1 POST `/auth/register`

-   **Auth**: Không
-   **Body** (`RegisterCustomerSchema`)
-   **Response**:

```json
{
    "success": true,
    "message": "Register successfully",
    "data": null
}
```

### 1.2 POST `/auth/login`

-   **Auth**: Không
-   **Headers**:
    -   `x-device-id`: `string | undefined`
-   **Body** (`LoginCustomerSchema`)
-   **Response**:

```json
{
    "success": true,
    "message": "Login successfully",
    "data": { "accessToken": "string" }
}
```

### 1.3 POST `/auth/logout`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Logout successfully",
    "data": null
}
```

### 1.4 POST `/auth/refresh-token`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Get new refresh token successfully",
    "data": { "accessToken": "string" }
}
```

### 1.5 POST `/auth/forgot-password`

-   **Body**:

```json
{
    "email": "string"
}
```

### 1.6 POST `/auth/verify-otp`

-   **Body**:

```json
{
    "email": "string",
    "otp": "string"
}
```

### 1.7 POST `/auth/reset-password`

-   **Body**:

```json
{
    "password": "string"
}
```

---

## 2) Cart (`/cart`)

### 2.1 GET `/cart/`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Lấy giỏ hàng thành công!",
    "data": {
        "cart": {
            "_id": "string",
            "owner": "string",
            "products": [
                {
                    "product": { "product_id": "string", "sku": "string" },
                    "lens": {
                        "lens_id": "string",
                        "sku": "string",
                        "parameters": {
                            "left": { "SPH": 0, "CYL": 0, "AXIS": 0 },
                            "right": { "SPH": 0, "CYL": 0, "AXIS": 0 },
                            "PD": 0
                        }
                    },
                    "quantity": 1
                }
            ],
            "totalProduct": 0,
            "createdAt": "string",
            "updatedAt": "string",
            "deletedAt": null
        }
    }
}
```

---

## 3) Checkout (`/checkout`)

### 3.1 POST `/checkout/sessions`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Tạo checkout session thành công",
    "data": { "checkoutSessionId": "string" }
}
```

### 3.2 GET `/checkout/sessions/:id`

-   **Auth**: Có
-   **Response**:

```json
{
    "success": true,
    "message": "Lay danh sach san pham trong checkout session thanh cong",
    "data": { "products": ["..."] }
}
```

---

## 4) Customer (`/customer`)

### 4.1 GET `/customer/`

-   **Auth**: Có

### 4.2 PATCH `/customer/profile`

-   **Auth**: Có

---

## 5) Orders (`/orders`)

### 5.1 GET `/orders/:orderId`

-   **Auth**: Có
-   **Response**
Chào bạn! Việc chuyển đổi từ Zod Schema sang TypeScript Interface là một bước rất phổ biến để giúp code tường minh và tối ưu hiệu suất (vì interface không cần tính toán lúc runtime như schema).

Dưới đây là Interface tương ứng cho OrderSchema của bạn:

TypeScript
import { Types } from 'mongoose';

```ts
{
    _id: string;
    invoiceId: string | Types.ObjectId;
    orderCode: string;
    type: OrderType[]; // Giả định OrderType là một enum hoặc union type đã định nghĩa
    products: IOrderProduct[]; // Giả định OrderProductSchema chuyển thành IOrderProduct
    status: OrderStatus; // Giả định OrderStatus là một enum hoặc union type

    assignerStaff: string | null;
    assignedStaff: string | null;
    assignedAt: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;

    price: number;

    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
```

### 5.2 PATCH `/orders/:orderId`

-   **Auth**: Có
-   **Body**
```json
{
    "invoiceId": "69783ba082c907b7851fecf6",
    "lensParameter": {
        "left": {
        "SPH": -2.50,
        "CYL": -0.75,
        "AXIS": 180
        },
        "right": {
        "SPH": -3.00,
        "CYL": -0.50,
        "AXIS": 175
        },
        "PD": 64
    }
}
```
-   **Response**
```json
{
    "success": true,
    "message": "Update success",
    "data": null
}
```

---

## 6) Invoices (`/invoices`)

### 6.1 POST `/invoices/`

-   **Auth**: Có

### 6.2 GET `/invoices/`

-   **Auth**: Có

### 6.3 GET `/invoices/:invoiceId`

-   **Auth**: Có

### 6.4 PATCH `/invoices/:id`

-   **Auth**: Có

### 6.5 PATCH `/invoices/:id/cancel`

-   **Auth**: Có

---

## 7) Payments (`/payments`)

### 7.1 POST `/payments/zalopay/result-callback`

-   **Auth**: Không

### 7.2 GET `/payments/zalopay/url/:invoiceId/:paymentId`

-   **Auth**: Có

---

## 8) Vouchers (`/vouchers`)

### 8.1 GET `/vouchers/available`

-   **Auth**: Không

### 8.2 GET `/vouchers/my-vouchers`

-   **Auth**: Có

### 8.3 POST `/vouchers/validate`

-   **Auth**: Có

### 8.4 POST `/vouchers/assign`

-   **Auth**: Có

---

# Common/Public API

Prefix: `/api/v1`

## 1) Products (`/products`)

### 1.1 GET `/products/`

-   **Auth**: Không

### 1.2 GET `/products/:id`

-   **Auth**: Không
