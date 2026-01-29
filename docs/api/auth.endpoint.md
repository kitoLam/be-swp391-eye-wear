# Auth API Documentation (Client)

Tài liệu mô tả các API **xác thực & quản lý phiên đăng nhập** cho phía Client (FE).

---

## Tổng quan

* **Base URL**: `/auth`
* **Auth type**: JWT (Access Token + Refresh Token)
* **Access Token**: trả về qua response body
* **Refresh Token**: lưu trong **httpOnly cookie** (`refreshTokenClient`)

---

## Token & Header Convention

### Access Token

```
Authorization: Bearer <accessToken>
```

### Refresh Token

* Được backend set tự động vào cookie
* FE **không cần** và **không được** đọc giá trị refresh token

### Device ID (bắt buộc)

```
x-device-id: <uuid | unique-string>
```

* Bắt buộc với `login` và `refresh-token`
* FE nên generate và lưu cố định theo thiết bị (localStorage)

---

## 1. Đăng ký tài khoản

**POST** `/auth/register`

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "name": "Nguyen Van A",
  "email": "a@gmail.com",
  "password": "12345678",
  "phone": "0912345678",
  "gender": "M"
}
```

### Rules

* `password >= 8 ký tự`
* `phone` theo format VN
* Email **không được trùng**

### Response

```json
{
  "message": "Register successfully",
  "data": {}
}
```

---

## 2. Đăng nhập

**POST** `/auth/login`

### Headers

```
Content-Type: application/json
x-device-id: <device-id>
```

### Body

```json
{
  "email": "a@gmail.com",
  "password": "12345678"
}
```

### Response

```json
{
  "message": "Login successfully",
  "data": {
    "accessToken": "<jwt-access-token>"
  }
}
```

### Side Effects

* Backend set cookie:

  * `refreshTokenClient` (httpOnly)

---

## 3. Đăng xuất

**POST** `/auth/logout`

### Headers

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Cookie (auto)

```
refreshTokenClient=<refresh-token>
```

### Response

```json
{
  "message": "Logout successfully",
  "data": {}
}
```

### Notes

* Access token sẽ bị đưa vào blacklist
* Refresh token bị xóa khỏi hệ thống & cookie

---

## 4. Refresh Access Token

**POST** `/auth/refresh-token`

### Headers

```
x-device-id: <device-id>
Content-Type: application/json
```

### Cookie (auto)

```
refreshTokenClient=<refresh-token>
```

### Response

```json
{
  "message": "Get new refresh token successfully",
  "data": {
    "accessToken": "<new-access-token>"
  }
}
```

### Rules

* Refresh token phải **match đúng deviceId**
* Nếu refresh token bị dùng sai device → token bị revoke

---

## 5. Quên mật khẩu (Gửi OTP)

**POST** `/auth/forgot-password`

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "email": "a@gmail.com"
}
```

### Response

```json
{
  "message": "Send OTP to mail success",
  "data": null
}
```

---

## 6. Verify OTP

**POST** `/auth/verify-otp`

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "email": "a@gmail.com",
  "otp": "1234"
}
```

### Response

```json
{
  "message": "Verify OTP success",
  "data": {
    "resetPasswordToken": "<reset-password-token>"
  }
}
```

### Notes

* `resetPasswordToken` là JWT đặc biệt
* Token này **chỉ dùng cho reset password**

---

## 7. Reset mật khẩu

**POST** `/auth/reset-password`

### Headers

```
Authorization: Bearer <resetPasswordToken>
Content-Type: application/json
```

### Body

```json
{
  "password": "newpassword123"
}
```

### Response

```json
{
  "message": "Reset password success",
  "data": null
}
```

---

## Error Format (Common)

```json
{
  "message": "Error message",
}
```

---

## FE Integration Notes ⭐

* Access token **chỉ lưu memory / state**, không lưu localStorage nếu có thể
* Khi gặp `401` → gọi `/auth/refresh-token` rồi retry request
* Nếu refresh token fail → redirect về `/login`
* `deviceId` phải **ổn định theo thiết bị** (không regenerate mỗi lần reload)

---

✅ End of document
