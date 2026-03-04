# Admin Voucher API - cURL Collection

Tài liệu này tổng hợp tất cả lệnh `curl` cho các endpoint trong `src/routes/admin/voucher.route.ts`.

## Biến môi trường (tuỳ chọn)

```bash
BASE_URL="http://localhost:3000/api/admin/vouchers"
TOKEN="<ADMIN_TOKEN>"
VOUCHER_ID="<VOUCHER_ID>"
USER_ID="<USER_ID>"
```

> Nếu project của bạn dùng prefix khác, hãy đổi lại `BASE_URL` cho đúng.

---

## 1) Create voucher

**Endpoint:** `POST /`

```bash
curl -X POST "$BASE_URL/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Voucher 10%",
    "description": "Giảm 10% cho đơn hàng",
    "code": "SALE10",
    "typeDiscount": "PERCENTAGE",
    "value": 10,
    "usageLimit": 100,
    "startedDate": "2026-01-01T00:00:00.000Z",
    "endedDate": "2026-12-31T23:59:59.000Z",
    "minOrderValue": 200000,
    "maxDiscountValue": 100000,
    "applyScope": "ALL",
    "status": "ACTIVE"
  }'
```

---

## 2) Get vouchers list

**Endpoint:** `GET /`

```bash
curl -X GET "$BASE_URL/" \
  -H "Authorization: Bearer $TOKEN"
```

### Có query params

```bash
curl -X GET "$BASE_URL/?page=1&limit=10&status=ACTIVE&applyScope=ALL" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3) Get statistics

**Endpoint:** `GET /statistics`

```bash
curl -X GET "$BASE_URL/statistics" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4) Get voucher detail

**Endpoint:** `GET /:id`

```bash
curl -X GET "$BASE_URL/$VOUCHER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5) Update voucher

**Endpoint:** `PATCH /:id`

```bash
curl -X PATCH "$BASE_URL/$VOUCHER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Voucher 15%",
    "value": 15,
    "maxDiscountValue": 150000,
    "status": "ACTIVE"
  }'
```

---

## 6) Delete voucher

**Endpoint:** `DELETE /:id`

```bash
curl -X DELETE "$BASE_URL/$VOUCHER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7) Grant voucher to users

**Endpoint:** `POST /:id/grant`

```bash
curl -X POST "$BASE_URL/$VOUCHER_ID/grant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user_id_1", "user_id_2"]
  }'
```

---

## 8) Revoke voucher from users

**Endpoint:** `POST /:id/revoke`

```bash
curl -X POST "$BASE_URL/$VOUCHER_ID/revoke" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user_id_1", "user_id_2"]
  }'
```

---

## 9) Get users of a voucher

**Endpoint:** `GET /:id/users`

```bash
curl -X GET "$BASE_URL/$VOUCHER_ID/users" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10) Get vouchers of a user (admin view)

**Endpoint:** `GET /users/:userId/vouchers`

```bash
curl -X GET "$BASE_URL/users/$USER_ID/vouchers" \
  -H "Authorization: Bearer $TOKEN"
```
