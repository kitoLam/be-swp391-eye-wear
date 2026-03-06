# API Endpoint Documentation

Complete API documentation generated from source code (routes + controllers + Zod validation schemas).

## Base URL Structure

- **Admin API**: `/api/${API_VERSION}/admin` (default: `/api/v1/admin`)
- **Client API**: `/api/${API_VERSION}` (default: `/api/v1`)
- **Common/Public API**: `/api/${API_VERSION}` (default: `/api/v1`)

## Response Format

All endpoints return responses in the following format (from `src/utils/api-response.ts`):

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

---

# ADMIN API

Base path: `/api/v1/admin`

## 1. Admin Authentication (`/auth`)

### POST `/admin/auth/login`
- **Auth**: None
- **Headers**: `x-device-id` (string, optional)
- **Body**:
```json
{
  "email": "string (email format)",
  "password": "string (min 8 chars)"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login successfully",
  "data": {
    "accessToken": "string"
  }
}
```
- **Side effect**: Sets `refreshToken` httpOnly cookie

### POST `/admin/auth/logout`
- **Auth**: Required (authenticateMiddleware)
- **Response**:
```json
{
  "success": true,
  "message": "Logout successfully",
  "data": null
}
```
- **Side effect**: Clears `refreshToken` cookie

### POST `/admin/auth/refresh-token`
- **Auth**: Required (verifyRefreshTokenMiddleware)
- **Headers**: `x-device-id` (string, **required**)
- **Cookies**: `refreshToken` (string, **required**)
- **Response**:
```json
{
  "success": true,
  "message": "Get new refresh token successfully",
  "data": {
    "accessToken": "string"
  }
}
```

### GET `/admin/auth/profile`
- **Auth**: Required
- **Response**: Returns current admin profile data

### PATCH `/admin/auth/profile/change-password`
- **Auth**: Required
- **Body**:
```json
{
  "oldPassword": "string",
  "newPassword": "string (min 8 chars)"
}
```

---

## 2. Admin Orders (`/orders`)

All routes require authentication.

### GET `/admin/orders`
- **Auth**: Required
- **Query**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `status`: string (optional)
  - `search`: string (optional)
- **Description**: Get orders list filtered by staffId and current admin

### GET `/admin/orders/total`
- **Auth**: Required
- **Query**:
  - `status`: string (optional)
  - `startDate`: string (optional)
  - `endDate`: string (optional)
- **Description**: Count total orders with filters

### GET `/admin/orders/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Get detailed order information

### PATCH `/admin/orders/:id/status/assign`
- **Auth**: Required (MANAGER role only)
- **Params**: `id` (ObjectId)
- **Body**:
```json
{
  "staffId": "string (ObjectId)"
}
```
- **Description**: Assign order to a staff member

### PATCH `/admin/orders/:id/status/approve`
- **Auth**: Required (SALE role)
- **Params**: `id` (ObjectId)
- **Body**:
```json
{
  "notes": "string (optional)"
}
```
- **Description**: Approve order after review

### PATCH `/admin/orders/:id/status/making`
- **Auth**: Required (OPERATION_STAFF only)
- **Params**: `id` (ObjectId)
- **Description**: Update order status to "making"

### PATCH `/admin/orders/:id/status/packaging`
- **Auth**: Required (OPERATION_STAFF only)
- **Params**: `id` (ObjectId)
- **Description**: Update order status to "packaging"

### PATCH `/admin/orders/:id/status/complete`
- **Auth**: Required (OPERATION_STAFF only)
- **Params**: `id` (ObjectId)
- **Description**: Mark order as completed

### GET `/admin/orders/stats/summary`
- **Auth**: Required
- **Query**:
  - `startDate`: string (ISO date)
  - `endDate`: string (ISO date)
- **Description**: Get order statistics summary

### GET `/admin/orders/stats/pending-breakdown`
- **Auth**: Required
- **Query**: Same as summary
- **Description**: Get breakdown of pending orders by status

---

## 3. Admin Invoices (`/invoices`)

### GET `/admin/invoices`
- **Auth**: Required
- **Query**:
  - `page`: number
  - `limit`: number
  - `status`: string (optional)
  - `search`: string (optional)
- **Description**: Get invoices list

### GET `/admin/invoices/handle-delivery`
- **Auth**: Required
- **Query**: Same as above
- **Description**: Get invoices assigned to current delivery staff

### GET `/admin/invoices/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Get invoice details

### GET `/admin/invoices/manager`
- **Auth**: Required (MANAGER only)
- **Query**: Pagination and filters
- **Description**: Manager view of all invoices

### PATCH `/admin/invoices/:id/status/delivered`
- **Auth**: None (public endpoint for delivery confirmation)
- **Params**: `id` (ObjectId)
- **Description**: Mark invoice as delivered

### PATCH `/admin/invoices/:id/status/delivering`
- **Auth**: None (public endpoint)
- **Params**: `id` (ObjectId)
- **Description**: Mark invoice as in delivery

### PATCH `/admin/invoices/:id/status/approve`
- **Auth**: Required (SALE_STAFF only)
- **Params**: `id` (ObjectId)
- **Description**: Approve invoice for processing

### PATCH `/admin/invoices/:id/status/reject`
- **Auth**: Required (SALE_STAFF only)
- **Params**: `id` (ObjectId)
- **Body**:
```json
{
  "reason": "string"
}
```
- **Description**: Reject invoice with reason

### PATCH `/admin/invoices/:id/assign/handle-delivery`
- **Auth**: Required (MANAGER only)
- **Params**: `id` (ObjectId)
- **Body**:
```json
{
  "deliveryStaffId": "string (ObjectId)"
}
```
- **Description**: Assign invoice to delivery staff

### PATCH `/admin/invoices/:id/status/onboard`
- **Auth**: Required (MANAGER only)
- **Params**: `id` (ObjectId)
- **Description**: Mark invoice as onboard for delivery

### PATCH `/admin/invoices/:id/status/complete`
- **Auth**: Required (MANAGER only)
- **Params**: `id` (ObjectId)
- **Description**: Complete invoice

### PATCH `/admin/invoices/:id/status/ready-to-ship`
- **Auth**: Required (OPERATION_STAFF only)
- **Params**: `id` (ObjectId)
- **Description**: Mark invoice as ready to ship

---

## 4. Admin Products (`/products`)

### GET `/admin/products`
- **Auth**: None
- **Query**:
  - `page`: number
  - `limit`: number
  - `search`: string (optional)
  - `category`: string (optional)
  - `status`: string (optional)
  - `minPrice`: number (optional)
  - `maxPrice`: number (optional)
- **Description**: Get products list with filters

### GET `/admin/products/search/name-slug`
- **Auth**: None
- **Query**: `q` (search term)
- **Description**: Search products by name or slug

### GET `/admin/products/search/sku/:sku`
- **Auth**: None
- **Params**: `sku` (string)
- **Description**: Find product by SKU

### GET `/admin/products/statistics`
- **Auth**: None
- **Description**: Get product statistics (total, by category, by status)

### GET `/admin/products/:id`
- **Auth**: None
- **Params**: `id` (ObjectId)
- **Description**: Get product details

### POST `/admin/products`
- **Auth**: Required (MANAGER only)
- **Body**:
```json
{
  "name": "string",
  "description": "string",
  "categoryId": "string (ObjectId)",
  "basePrice": "number",
  "images": ["string (URLs)"],
  "variants": [
    {
      "sku": "string",
      "attributes": {},
      "price": "number",
      "stock": "number"
    }
  ]
}
```
- **Description**: Create generic product

### POST `/admin/products/available`
- **Auth**: Required (MANAGER only)
- **Body**: Similar to above
- **Description**: Create product with available stock

### POST `/admin/products/pre-order`
- **Auth**: Required (MANAGER only)
- **Body**: Similar to above with pre-order specific fields
- **Description**: Create pre-order product

### PATCH `/admin/products/:id`
- **Auth**: Required (MANAGER only)
- **Params**: `id` (ObjectId)
- **Body**: Partial product update
- **Description**: Update product

### DELETE `/admin/products/:id`
- **Auth**: Required (MANAGER only)
- **Params**: `id` (ObjectId)
- **Description**: Delete product

---

## 5. Admin Categories (`/categories`)

All routes require authentication.

### GET `/admin/categories`
- **Auth**: Required
- **Query**:
  - `page`: number
  - `limit`: number
  - `search`: string (optional)
- **Description**: Get categories list

### GET `/admin/categories/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Get category details

### POST `/admin/categories`
- **Auth**: Required (MANAGER only)
- **Body**:
```json
{
  "name": "string",
  "parentId": "string (ObjectId, optional)",
  "thumbnail": "string (URL, optional)"
}
```
- **Description**: Create category

### PATCH `/admin/categories/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Body**: Partial category update
- **Description**: Update category

### DELETE `/admin/categories/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Delete category

---

## 6. Admin Attributes (`/attributes`)

All routes require authentication.

### GET `/admin/attributes`
- **Auth**: Required
- **Query**:
  - `page`: number
  - `limit`: number
  - `type`: string (optional, e.g., "color", "size")
- **Description**: Get attributes list

### POST `/admin/attributes`
- **Auth**: Required
- **Body**:
```json
{
  "name": "string",
  "type": "string",
  "values": ["string"]
}
```
- **Description**: Create attribute

### GET `/admin/attributes/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Get attribute details

### PATCH `/admin/attributes/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Body**: Partial attribute update
- **Description**: Update attribute

### DELETE `/admin/attributes/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Delete attribute

---

## 7. Admin Customers (`/customers`)

All routes require authentication.

### GET `/admin/customers`
- **Auth**: Required
- **Query**:
  - `page`: number
  - `limit`: number
  - `search`: string (optional)
- **Description**: Get customers list

### GET `/admin/customers/list-by-spending`
- **Auth**: Required
- **Query**:
  - `minSpending`: number (optional)
  - `maxSpending`: number (optional)
  - `page`: number
  - `limit`: number
- **Description**: Get customers filtered by total spending

### GET `/admin/customers/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Get customer details

### POST `/admin/customers`
- **Auth**: Required (SYSTEM_ADMIN only)
- **Body**:
```json
{
  "email": "string",
  "fullName": "string",
  "phone": "string",
  "password": "string"
}
```
- **Description**: Create customer account

### PATCH `/admin/customers/:id`
- **Auth**: Required (SYSTEM_ADMIN only)
- **Params**: `id` (ObjectId)
- **Body**: Partial customer update
- **Description**: Update customer

### DELETE `/admin/customers/:id`
- **Auth**: Required (SYSTEM_ADMIN only)
- **Params**: `id` (ObjectId)
- **Description**: Delete customer

---

## 8. Admin Vouchers (`/vouchers`)

All routes require authentication.

### GET `/admin/vouchers`
- **Auth**: Required
- **Description**: Get all vouchers

### GET `/admin/vouchers/statistics`
- **Auth**: Required
- **Description**: Get voucher usage statistics

### GET `/admin/vouchers/:id`
- **Auth**: Required
- **Params**: `id` (string)
- **Description**: Get voucher details

### POST `/admin/vouchers`
- **Auth**: Required
- **Body**:
```json
{
  "code": "string (unique)",
  "type": "percentage | fixed",
  "value": "number",
  "minOrderValue": "number (optional)",
  "maxDiscount": "number (optional)",
  "startDate": "string (ISO date)",
  "endDate": "string (ISO date)",
  "usageLimit": "number (optional)",
  "isPublic": "boolean"
}
```
- **Description**: Create voucher

### PATCH `/admin/vouchers/:id`
- **Auth**: Required
- **Params**: `id` (string)
- **Body**: Partial voucher update
- **Description**: Update voucher

### DELETE `/admin/vouchers/:id`
- **Auth**: Required
- **Params**: `id` (string)
- **Description**: Delete voucher

### POST `/admin/vouchers/:id/grant`
- **Auth**: Required
- **Params**: `id` (string)
- **Body**:
```json
{
  "userIds": ["string (ObjectId)"]
}
```
- **Description**: Grant voucher to specific users

### POST `/admin/vouchers/:id/revoke`
- **Auth**: Required
- **Params**: `id` (string)
- **Body**:
```json
{
  "userIds": ["string (ObjectId)"]
}
```
- **Description**: Revoke voucher from users

### GET `/admin/vouchers/:id/users`
- **Auth**: Required
- **Params**: `id` (string)
- **Description**: Get list of users who have this voucher

### GET `/admin/vouchers/users/:userId/vouchers`
- **Auth**: Required
- **Params**: `userId` (string)
- **Description**: Get all vouchers for a specific user

---

## 9. Admin Staff Management (`/staff`)

All routes require authentication.

### GET `/admin/staff/admins`
- **Auth**: Required (MANAGER or SYSTEM_ADMIN)
- **Query**:
  - `page`: number
  - `limit`: number
  - `role`: string (optional)
- **Description**: Get admin staff list

### POST `/admin/staff`
- **Auth**: Required
- **Body**:
```json
{
  "email": "string",
  "fullName": "string",
  "role": "SALE_STAFF | OPERATION_STAFF | DELIVERY_STAFF | MANAGER",
  "password": "string"
}
```
- **Description**: Create staff account

---

## 10. Admin Accounts (`/admin-accounts`)

All routes require authentication.

### GET `/admin/admin-accounts`
- **Auth**: Required
- **Query**: Pagination + filters
- **Description**: Get admin accounts list

### GET `/admin/admin-accounts/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Get admin account details

### POST `/admin/admin-accounts`
- **Auth**: Required (SYSTEM_ADMIN only)
- **Body**: Admin account creation schema
- **Description**: Create admin account

### PATCH `/admin/admin-accounts/:id`
- **Auth**: Required (SYSTEM_ADMIN only)
- **Params**: `id` (ObjectId)
- **Body**: Partial admin account update
- **Description**: Update admin account

### DELETE `/admin/admin-accounts/:id`
- **Auth**: Required (SYSTEM_ADMIN only)
- **Params**: `id` (ObjectId)
- **Description**: Delete admin account

---

## 11. Admin Return Tickets (`/return-tickets`)

All routes require authentication.

### GET `/admin/return-tickets`
- **Auth**: Required
- **Query**: Pagination + status filter
- **Description**: Get all return tickets

### GET `/admin/return-tickets/my-history`
- **Auth**: Required
- **Query**: Pagination
- **Description**: Get return tickets handled by current staff

### GET `/admin/return-tickets/returned-orders`
- **Auth**: Required
- **Query**: Pagination
- **Description**: Get orders that have been returned

### PATCH `/admin/return-tickets/:id/staff-verify`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Staff verification of return ticket

### PATCH `/admin/return-tickets/:id/status/approved`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Approve return request

### PATCH `/admin/return-tickets/:id/status/rejected`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Reject return request

### PATCH `/admin/return-tickets/:id/status/in-progress`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Mark return as in progress

### PATCH `/admin/return-tickets/:id/status/cancel`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Cancel return ticket

### PATCH `/admin/return-tickets/:id/status/delivering`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Mark return as being delivered back

### PATCH `/admin/return-tickets/:id/status/returned`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Mark return as completed

---

## 12. Admin Report Tickets (`/report-tickets`)

All routes require authentication.

### POST `/admin/report-tickets`
- **Auth**: Required
- **Body**:
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "priority": "low | medium | high"
}
```
- **Description**: Create internal report ticket

### GET `/admin/report-tickets`
- **Auth**: Required
- **Query**: Pagination + filters
- **Description**: Get all report tickets

### GET `/admin/report-tickets/my-history`
- **Auth**: Required
- **Query**: Pagination
- **Description**: Get report tickets created by current staff

### GET `/admin/report-tickets/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Get report ticket details

### PATCH `/admin/report-tickets/:id/status/resolve`
- **Auth**: Required (SYSTEM_ADMIN only)
- **Params**: `id` (ObjectId)
- **Description**: Resolve report ticket

### PATCH `/admin/report-tickets/:id/status/processing`
- **Auth**: Required (SYSTEM_ADMIN only)
- **Params**: `id` (ObjectId)
- **Description**: Mark report ticket as processing

### PATCH `/admin/report-tickets/:id/status/reject`
- **Auth**: Required (SYSTEM_ADMIN only)
- **Params**: `id` (ObjectId)
- **Description**: Reject report ticket

---

## 13. Admin Profile Requests (`/profile-requests`)

All routes require authentication.

### GET `/admin/profile-requests`
- **Auth**: Required
- **Query**: Pagination
- **Description**: Get profile update requests (for managers)

### GET `/admin/profile-requests/:id`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Description**: Get profile request details

### POST `/admin/profile-requests`
- **Auth**: Required
- **Body**:
```json
{
  "fullName": "string (optional)",
  "phone": "string (optional)",
  "avatar": "string (URL, optional)",
  "reason": "string"
}
```
- **Description**: Submit profile update request (operation/sale staff to manager)

### PATCH `/admin/profile-requests/cancel-request`
- **Auth**: Required
- **Description**: Cancel own profile request

### PATCH `/admin/profile-requests/:id/status/approved`
- **Auth**: Required (MANAGER)
- **Params**: `id` (ObjectId)
- **Description**: Approve profile update request

### PATCH `/admin/profile-requests/:id/status/rejected`
- **Auth**: Required (MANAGER)
- **Params**: `id` (ObjectId)
- **Description**: Reject profile update request

---

## 14. Admin Import Products (`/import-products`)

### GET `/admin/import-products`
- **Auth**: Required (OPERATION_STAFF or MANAGER)
- **Description**: Get list of product imports

### POST `/admin/import-products`
- **Auth**: Required (OPERATION_STAFF only)
- **Body**:
```json
{
  "productId": "string (ObjectId)",
  "sku": "string",
  "quantity": "number",
  "importPrice": "number",
  "notes": "string (optional)"
}
```
- **Description**: Import product stock

---

## 15. Admin Pre-Order Imports (`/pre-order-imports`)

### POST `/admin/pre-order-imports`
- **Auth**: Required (MANAGER only)
- **Body**:
```json
{
  "productId": "string (ObjectId)",
  "expectedDate": "string (ISO date)",
  "quantity": "number",
  "notes": "string (optional)"
}
```
- **Description**: Create pre-order import record

### PATCH `/admin/pre-order-imports/:id/cancel`
- **Auth**: Required (MANAGER only)
- **Params**: `id` (string)
- **Description**: Cancel pre-order import

### GET `/admin/pre-order-imports`
- **Auth**: Required
- **Query**: Pagination + filters
- **Description**: Get pre-order imports list

---

## 16. Admin AI Conversations (`/ai-conversations`)

All routes require authentication.

### GET `/admin/ai-conversations`
- **Auth**: Required
- **Query**: Pagination
- **Description**: Get list of customer AI conversations

### GET `/admin/ai-conversations/:id/messages`
- **Auth**: Required
- **Params**: `id` (ObjectId)
- **Query**: Pagination
- **Description**: Get messages for a specific AI conversation

---

# CLIENT API

Base path: `/api/v1`

## 1. Client Authentication (`/auth`)

### POST `/auth/register`
- **Auth**: None
- **Body**:
```json
{
  "email": "string (email format)",
  "password": "string (min 8 chars)",
  "fullName": "string",
  "phone": "string",
  "dateOfBirth": "string (ISO date, optional)",
  "gender": "male | female | other (optional)"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Register successfully",
  "data": {
    "accessToken": "string"
  }
}
```
- **Side effect**: Sets `refreshToken` httpOnly cookie

### POST `/auth/login`
- **Auth**: None
- **Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response**: Same as register

### POST `/auth/logout`
- **Auth**: Required (authenticateMiddlewareClient)
- **Description**: Logout customer

### POST `/auth/refresh-token`
- **Auth**: Required (verifyRefreshTokenMiddlewareClient)
- **Headers**: `x-device-id` (string, required)
- **Cookies**: `refreshToken` (string, required)
- **Description**: Refresh access token

### POST `/auth/request-reset-password`
- **Auth**: None
- **Body**:
```json
{
  "email": "string"
}
```
- **Description**: Request password reset (sends OTP to email)

### POST `/auth/request-reset-password/verify-otp`
- **Auth**: None
- **Body**:
```json
{
  "email": "string",
  "otp": "string (6 digits)"
}
```
- **Response**: Returns reset password token

### POST `/auth/reset-password`
- **Auth**: Required (verifyResetPasswordTokenMiddleware)
- **Body**:
```json
{
  "newPassword": "string (min 8 chars)"
}
```
- **Description**: Reset password with token from OTP verification

### GET `/auth/google`
- **Auth**: None
- **Query**: `state` (optional, for redirect after login)
- **Description**: Initiate Google OAuth login flow

### GET `/auth/google/callback`
- **Auth**: None (handled by Passport)
- **Description**: Google OAuth callback endpoint

### POST `/auth/request-merge-account`
- **Auth**: None
- **Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
- **Description**: Request to merge Google account with existing email/password account

### POST `/auth/request-merge-account/verify-otp`
- **Auth**: None
- **Body**:
```json
{
  "email": "string",
  "otp": "string"
}
```
- **Description**: Verify OTP to complete account merge

---

## 2. Client Shopping Cart (`/cart`)

All routes require authentication (authenticateMiddlewareClient).

### GET `/cart`
- **Auth**: Required
- **Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "string",
        "name": "string",
        "sku": "string",
        "price": "number",
        "quantity": "number",
        "image": "string",
        "prescription": {}
      }
    ],
    "totalItems": "number",
    "subtotal": "number"
  }
}
```

### POST `/cart/add-product`
- **Auth**: Required
- **Body**:
```json
{
  "productId": "string (ObjectId)",
  "sku": "string",
  "quantity": "number (default: 1)",
  "prescription": {
    "leftEye": {
      "sphere": "number",
      "cylinder": "number",
      "axis": "number"
    },
    "rightEye": {
      "sphere": "number",
      "cylinder": "number",
      "axis": "number"
    },
    "pd": "number (pupillary distance)"
  }
}
```

### PATCH `/cart/update-quantity`
- **Auth**: Required
- **Body**:
```json
{
  "productId": "string",
  "sku": "string",
  "quantity": "number"
}
```

### PATCH `/cart/update-prescription`
- **Auth**: Required
- **Body**:
```json
{
  "productId": "string",
  "sku": "string",
  "prescription": {}
}
```

### DELETE `/cart/remove-product`
- **Auth**: Required
- **Body**:
```json
{
  "productId": "string",
  "sku": "string"
}
```

### DELETE `/cart/clear`
- **Auth**: Required
- **Description**: Clear entire cart

---

## 3. Client Checkout (`/checkout`)

All routes require authentication.

### POST `/checkout/sessions`
- **Auth**: Required
- **Body**:
```json
{
  "items": [
    {
      "productId": "string",
      "sku": "string",
      "quantity": "number",
      "prescription": {}
    }
  ]
}
```
- **Response**: Returns checkout session ID

### GET `/checkout/sessions/:id`
- **Auth**: Required
- **Params**: `id` (session ID)
- **Description**: Get products in checkout session

---

## 4. Client Orders (`/orders`)

All routes require authentication.

### GET `/orders/:orderId`
- **Auth**: Required
- **Params**: `orderId` (string)
- **Description**: Get order details

### PATCH `/orders/:orderId`
- **Auth**: Required
- **Params**: `orderId` (string)
- **Body**:
```json
{
  "items": [
    {
      "orderProductId": "string",
      "prescription": {}
    }
  ]
}
```
- **Description**: Update prescription for order items (before processing)

---

## 5. Client Invoices (`/invoices`)

All routes require authentication.

### POST `/invoices`
- **Auth**: Required
- **Body**:
```json
{
  "orderId": "string (ObjectId)",
  "shippingAddress": {
    "fullName": "string",
    "phone": "string",
    "address": "string",
    "ward": "string",
    "district": "string",
    "province": "string"
  },
  "paymentMethod": "cod | vnpay | zalopay | payos",
  "voucherCode": "string (optional)",
  "notes": "string (optional)"
}
```
- **Response**: Returns invoice ID and payment URL (if online payment)

### GET `/invoices`
- **Auth**: Required
- **Description**: Get customer's invoices list

### GET `/invoices/:invoiceId`
- **Auth**: Required
- **Params**: `invoiceId` (string)
- **Description**: Get invoice details

### PATCH `/invoices/:id`
- **Auth**: Required
- **Params**: `id` (string)
- **Body**:
```json
{
  "shippingAddress": {},
  "notes": "string"
}
```
- **Description**: Update invoice (before processing)

### PATCH `/invoices/:id/cancel`
- **Auth**: Required
- **Params**: `id` (string)
- **Description**: Cancel invoice (if not yet processed)

---

## 6. Client Payments (`/payments`)

### GET `/payments/vnpay/result-callback`
- **Auth**: None (VNPay callback)
- **Query**: VNPay payment result parameters
- **Description**: Handle VNPay payment result

### POST `/payments/zalopay/result-callback`
- **Auth**: None (ZaloPay callback)
- **Body**: ZaloPay callback data
- **Description**: Handle ZaloPay payment result

### POST `/payments/payos/result-callback`
- **Auth**: None (PayOS callback)
- **Body**: PayOS callback data
- **Description**: Handle PayOS payment result

### GET `/payments/vnpay/url/:invoiceId/:paymentId`
- **Auth**: Required
- **Params**: `invoiceId`, `paymentId`
- **Description**: Get VNPay payment URL

### GET `/payments/zalopay/url/:invoiceId/:paymentId`
- **Auth**: Required
- **Params**: `invoiceId`, `paymentId`
- **Description**: Get ZaloPay payment URL

### GET `/payments/payos/url/:invoiceId/:paymentId`
- **Auth**: Required
- **Params**: `invoiceId`, `paymentId`
- **Description**: Get PayOS payment URL

### GET `/payments/:paymentId`
- **Auth**: Required
- **Params**: `paymentId` (string)
- **Description**: Get payment status

---

## 7. Client Profile (`/customer`)

All routes require authentication.

### GET `/customer`
- **Auth**: Required
- **Description**: Get customer profile

### PATCH `/customer/profile`
- **Auth**: Required
- **Body**:
```json
{
  "fullName": "string (optional)",
  "phone": "string (optional)",
  "dateOfBirth": "string (ISO date, optional)",
  "gender": "male | female | other (optional)",
  "avatar": "string (URL, optional)"
}
```

### PATCH `/customer/profile/password`
- **Auth**: Required
- **Body**:
```json
{
  "oldPassword": "string",
  "newPassword": "string (min 8 chars)"
}
```

### POST `/customer/profile/address`
- **Auth**: Required
- **Body**:
```json
{
  "fullName": "string",
  "phone": "string",
  "address": "string",
  "ward": "string",
  "district": "string",
  "province": "string",
  "isDefault": "boolean (optional)"
}
```

### GET `/customer/profile/address`
- **Auth**: Required
- **Description**: Get all customer addresses

### GET `/customer/profile/address/default`
- **Auth**: Required
- **Description**: Get default address

### PATCH `/customer/profile/address/:id`
- **Auth**: Required
- **Params**: `id` (string)
- **Body**: Partial address update

### PATCH `/customer/profile/address/change-default/:id`
- **Auth**: Required
- **Params**: `id` (string)
- **Description**: Set address as default

### DELETE `/customer/profile/address/:id`
- **Auth**: Required
- **Params**: `id` (string)

### POST `/customer/profile/prescription`
- **Auth**: Required
- **Body**:
```json
{
  "name": "string (optional, e.g., 'Daily use')",
  "leftEye": {
    "sphere": "number",
    "cylinder": "number",
    "axis": "number"
  },
  "rightEye": {
    "sphere": "number",
    "cylinder": "number",
    "axis": "number"
  },
  "pd": "number",
  "isDefault": "boolean (optional)"
}
```

### GET `/customer/profile/prescription`
- **Auth**: Required
- **Description**: Get all customer prescriptions

### GET `/customer/profile/prescription/default`
- **Auth**: Required
- **Description**: Get default prescription

### PATCH `/customer/profile/prescription/:id`
- **Auth**: Required
- **Params**: `id` (string)
- **Body**: Partial prescription update

### PATCH `/customer/profile/prescription/change-default/:id`
- **Auth**: Required
- **Params**: `id` (string)

### DELETE `/customer/profile/prescription/:id`
- **Auth**: Required
- **Params**: `id` (string)

---

## 8. Client Wishlist (`/wishlist`)

All routes require authentication.

### GET `/wishlist`
- **Auth**: Required
- **Response**: List of wishlist products

### POST `/wishlist/products/:productId`
- **Auth**: Required
- **Params**: `productId` (ObjectId)
- **Description**: Add product to wishlist

### DELETE `/wishlist/products/:productId`
- **Auth**: Required
- **Params**: `productId` (ObjectId)
- **Description**: Remove product from wishlist

### DELETE `/wishlist/products`
- **Auth**: Required
- **Description**: Clear entire wishlist

---

## 9. Client Vouchers (`/vouchers`)

### GET `/vouchers/available`
- **Auth**: None
- **Description**: Get publicly available vouchers

### GET `/vouchers/my-vouchers`
- **Auth**: Required
- **Description**: Get customer's vouchers

### GET `/vouchers/client/:clientId`
- **Auth**: Required
- **Params**: `clientId` (string)
- **Description**: Get vouchers for specific client

### POST `/vouchers/validate`
- **Auth**: Required
- **Body**:
```json
{
  "code": "string",
  "orderAmount": "number"
}
```
- **Description**: Validate voucher for order

### POST `/vouchers/assign`
- **Auth**: Required
- **Description**: Assign voucher to current client

### POST `/vouchers/claim-voucher`
- **Auth**: Required
- **Body**:
```json
{
  "code": "string"
}
```
- **Description**: Claim public voucher

---

## 10. Client Return Tickets (`/return-tickets`)

All routes require authentication.

### POST `/return-tickets`
- **Auth**: Required
- **Body**:
```json
{
  "orderId": "string (ObjectId)",
  "invoiceId": "string (ObjectId)",
  "reason": "string",
  "description": "string",
  "items": [
    {
      "orderProductId": "string",
      "quantity": "number",
      "reason": "string"
    }
  ],
  "images": ["string (URLs)"]
}
```

### GET `/return-tickets`
- **Auth**: Required
- **Query**: Pagination
- **Description**: Get customer's return tickets

---

## 11. Client AI Conversation (`/ai-conversation`)

All routes require authentication.

### GET `/ai-conversation`
- **Auth**: Required
- **Description**: Get customer's AI conversation history

### POST `/ai-conversation/chat`
- **Auth**: Required
- **Body**:
```json
{
  "message": "string"
}
```
- **Response**: AI assistant response with product recommendations

---

## 12. Client AI Messages (`/ai-message`)

All routes require authentication.

### GET `/ai-message`
- **Auth**: Required
- **Query**:
  - `conversationId`: string (optional)
  - `page`: number
  - `limit`: number
- **Description**: Get AI message history

---

# COMMON/PUBLIC API

Base path: `/api/v1`

## 1. Common Products (`/products`)

### GET `/products`
- **Auth**: None
- **Query**:
  - `page`: number (default: 1)
  - `limit`: number (default: 12)
  - `search`: string (optional)
  - `category`: string (ObjectId, optional)
  - `minPrice`: number (optional)
  - `maxPrice`: number (optional)
  - `color`: string (optional)
  - `size`: string (optional)
  - `brand`: string (optional)
  - `material`: string (optional)
  - `shape`: string (optional)
  - `sort`: "price_asc | price_desc | newest | popular"
- **Description**: Browse products with filters

### GET `/products/specs`
- **Auth**: None
- **Description**: Get all distinct product specifications for filters (colors, sizes, brands, etc.)

### GET `/products/:id`
- **Auth**: None
- **Params**: `id` (ObjectId)
- **Description**: Get product details

### GET `/products/:id/variants/:sku`
- **Auth**: None
- **Params**: `id` (ObjectId), `sku` (string)
- **Description**: Get specific product variant details

---

## 2. Common Categories (`/categories`)

### GET `/categories/tree`
- **Auth**: None
- **Response**: Categories in hierarchical tree structure
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "name": "string",
      "thumbnail": "string",
      "children": [
        {
          "_id": "string",
          "name": "string",
          "thumbnail": "string",
          "children": []
        }
      ]
    }
  ]
}
```

---

## 3. Common Upload (`/upload`)

### POST `/upload/single`
- **Auth**: None
- **Body**: `multipart/form-data`
  - `file`: File (image)
- **Description**: Upload single file to cloud storage
- **Response**:
```json
{
  "success": true,
  "data": {
    "url": "string"
  }
}
```

### POST `/upload/many`
- **Auth**: None
- **Body**: `multipart/form-data`
  - `files`: File[] (max 50 files)
- **Description**: Upload multiple files
- **Response**:
```json
{
  "success": true,
  "data": {
    "urls": ["string"]
  }
}
```

---

## 4. Common Shipping (`/ships`)

### GET `/ships/invoice/:invoiceId/ship-code`
- **Auth**: None
- **Params**: `invoiceId` (string)
- **Description**: Get shipping tracking code for invoice
- **Response**:
```json
{
  "success": true,
  "data": {
    "shipCode": "string",
    "carrier": "string",
    "status": "string"
  }
}
```

---

# Authentication & Authorization

## Admin Roles

- **SYSTEM_ADMIN**: Full system access
- **MANAGER**: Manage staff, approve operations, view all data
- **SALE_STAFF**: Handle orders, customer service, approve invoices
- **OPERATION_STAFF**: Process orders, manage inventory
- **DELIVERY_STAFF**: Handle deliveries, update delivery status

## Client Authentication

Clients authenticate using JWT tokens:
- **Access Token**: Short-lived (7 days), sent in `Authorization: Bearer <token>` header
- **Refresh Token**: Long-lived (30 days), stored in httpOnly cookie

## Common Headers

All authenticated requests should include:
```
Authorization: Bearer <access_token>
x-device-id: <unique_device_id>
```

---

# Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable Entity (business logic error) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

# Rate Limiting

Rate limits are applied per IP address:
- **Public endpoints**: 100 requests per 15 minutes
- **Authenticated endpoints**: 500 requests per 15 minutes
- **Admin endpoints**: 1000 requests per 15 minutes

---

# Webhooks

## Payment Gateway Callbacks

The following endpoints are webhooks called by payment gateways:
- `POST /payments/vnpay/result-callback`
- `POST /payments/zalopay/result-callback`
- `POST /payments/payos/result-callback`

These endpoints do not require authentication and should be whitelisted in firewall rules.

---

# WebSocket Events (Socket.IO)

## Connection
- **URL**: `ws://localhost:5000` (or production URL)
- **Auth**: Pass JWT token in connection query: `?token=<access_token>`

## Events

### Client → Server
- `join_order_room`: Join room for order updates
- `join_invoice_room`: Join room for invoice updates

### Server → Client
- `order_updated`: Order status changed
- `invoice_updated`: Invoice status changed
- `new_message`: New AI conversation message

---

**Last Updated**: Generated from source code on 2026-03-06

**Total Endpoints**: 95+ endpoints across admin, client, and common APIs