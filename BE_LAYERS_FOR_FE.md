# Achi Vegan House — 4 Tầng Backend & Việc FE Cần Làm

> Tài liệu này mô tả 4 tầng infrastructure đã thêm vào BE,
> và những gì FE **phải làm / nên làm** để hoạt động trơn tru với chúng.

---

## Tầng 1 — Validation (Zod) + Rate Limiting

### BE đã làm gì?

- Toàn bộ request body được validate bằng **Zod v4** trước khi vào controller.
- Reservation request có **rate limit: 5 lần / 10 phút / IP**.
- Reservation form có **honeypot field** chống bot.

### FE phải làm gì?

#### 1a. Xử lý lỗi validation (HTTP 400)

Khi FE gửi data sai, BE trả về:

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email" },
    { "field": "guestCount", "message": "Too small: expected >= 1" }
  ]
}
```

FE cần đọc `errors[]` để hiển thị lỗi đúng field thay vì chỉ show `message`.

#### 1b. Xử lý rate limit (HTTP 429)

Khi gửi reservation quá 5 lần trong 10 phút, BE trả `429 Too Many Requests`.
FE cần handle riêng case này — hiển thị thông báo kiểu:

> "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút."

#### 1c. Thêm honeypot field vào form đặt bàn

FE cần thêm 1 input ẩn tên `website` vào form reservation (để bẫy bot).
Bot sẽ điền vào, người thật không điền. BE sẽ silently reject nếu field này có giá trị.

```html
<!-- Thêm vào form đặt bàn, ẩn bằng CSS (không dùng display:none) -->
<input
  type="text"
  name="website"
  value=""
  style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;"
  tabindex="-1"
  autocomplete="off"
/>
```

---

## Tầng 2 — Docker (Multi-stage + docker-compose)

### BE đã làm gì?

- `Dockerfile` multi-stage: build TypeScript → chạy dist (image nhỏ, production-ready).
- `docker-compose.yml`: chạy BE + MongoDB local với 1 lệnh.
- BE chạy port `5000` trong container.

### FE phải làm gì?

#### 2a. Chạy BE local để dev

FE dev không cần cài Node/MongoDB riêng, chỉ cần Docker:

```bash
# Ở thư mục BE
docker compose up -d

# BE sẽ chạy tại: http://localhost:5000
# API base:       http://localhost:5000/api/v1
```

#### 2b. Cấu hình `NEXT_PUBLIC_API_URL` (hoặc tương đương)

FE cần có biến môi trường trỏ đến BE:

```env
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# .env.production
NEXT_PUBLIC_API_URL=https://api.achiveganhouse.com/api/v1
```

#### 2c. Gửi credentials (bắt buộc vì dùng cookie auth)

Mọi fetch đến BE phải có `credentials: "include"`:

```typescript
// Mọi API call đến BE
fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
  credentials: "include", // BẮT BUỘC — để gửi/nhận cookie httpOnly
});
```

Hoặc nếu dùng axios, set global:

```typescript
axios.defaults.withCredentials = true;
```

---

## Tầng 3 — CI/CD (GitHub Actions + Render Auto-Deploy)

### BE đã làm gì?

- `.github/workflows/ci.yml`: mỗi push lên `main` sẽ chạy lint + build + test tự động.
- Render chỉ deploy khi **CI pass** — tránh deploy code lỗi lên production.

### FE phải làm gì?

#### 3a. FE nên có CI tương tự

Tạo `.github/workflows/ci.yml` cho FE repo với ít nhất:

```yaml
- Lint (ESLint)
- Type check (tsc --noEmit)
- Build (next build)
- Test (nếu có)
```

Cấu hình Vercel/host FE deploy "After CI Checks Pass" giống BE.

#### 3b. Biết BE deploy khi nào

- BE auto-deploy sau mỗi lần merge vào `main` (nếu CI pass).
- Nếu FE thấy API lỗi sau deploy mới của BE, chờ ~2-3 phút cho Render restart.
- Health check BE: `GET https://api.achiveganhouse.com/healthz` → `{ ok: true }`

#### 3c. Không hardcode URL production trong code

Dùng env vars (đã nói ở Tầng 2) — CI/CD của FE sẽ inject đúng URL theo môi trường.

---

## Tầng 4 — Observability (Winston + Sentry + Swagger)

### BE đã làm gì?

- **Winston**: log tất cả request/error ra stdout (Render lưu lại).
- **Sentry**: tracking error tự động nếu có env `SENTRY_DSN` (optional, bật bằng env).
- **Swagger UI**: docs API tự động tại `GET /api-docs`.

### FE phải làm gì?

#### 4a. Dùng Swagger để xem API trong lúc dev

Mở browser tại:

```
http://localhost:5000/api-docs       ← local
https://api.achiveganhouse.com/api-docs  ← production (nếu mở public)
```

Đây là nguồn truth về request/response shape — không cần hỏi BE dev.

#### 4b. FE nên setup Sentry riêng cho mình

BE đã có Sentry tracking server-side errors. FE nên cài Sentry để tracking client-side errors:

```bash
npm install @sentry/nextjs   # hoặc @sentry/react, tùy stack
```

Thêm `SENTRY_DSN` vào env của FE (khác DSN của BE).

Khi user gặp lỗi trên FE mà liên quan đến API, cả 2 bên Sentry sẽ có log → dễ debug.

#### 4c. FE nên log request errors ra console (dev) và Sentry (production)

Tạo 1 API client wrapper để centralize error handling:

```typescript
// lib/apiClient.ts
async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    // Tự động refresh token nếu 401
    if (res.status === 401 && path !== "/auth/refresh") {
      await apiFetch("/auth/refresh", { method: "POST" });
      return apiFetch(path, options); // retry
    }

    // Report lên Sentry nếu 5xx
    if (res.status >= 500) {
      Sentry.captureException(new Error(`API ${res.status}: ${path}`), {
        extra: body,
      });
    }

    throw { status: res.status, ...body };
  }

  return res.json();
}
```

---

## Tóm tắt nhanh — Checklist cho FE

| #   | Việc cần làm                                               | Tầng   | Ưu tiên        |
| --- | ---------------------------------------------------------- | ------ | -------------- |
| 1   | Xử lý `errors[]` trong response 400 để show lỗi theo field | Tầng 1 | 🔴 Bắt buộc    |
| 2   | Hiển thị thông báo riêng khi nhận 429 (rate limit)         | Tầng 1 | 🔴 Bắt buộc    |
| 3   | Thêm honeypot field `website` vào form đặt bàn             | Tầng 1 | 🔴 Bắt buộc    |
| 4   | Gửi `credentials: "include"` với mọi API call              | Tầng 2 | 🔴 Bắt buộc    |
| 5   | Set env `NEXT_PUBLIC_API_URL` cho từng môi trường          | Tầng 2 | 🔴 Bắt buộc    |
| 6   | Chạy `docker compose up` để dev local thay vì cài thủ công | Tầng 2 | 🟡 Khuyên dùng |
| 7   | Setup CI/CD cho FE (lint + type check + build)             | Tầng 3 | 🟡 Khuyên dùng |
| 8   | Dùng Swagger `/api-docs` để xem API docs                   | Tầng 4 | 🟡 Khuyên dùng |
| 9   | Setup Sentry cho FE (DSN riêng)                            | Tầng 4 | 🟡 Khuyên dùng |
| 10  | Tạo `apiFetch` wrapper với auto-refresh token + Sentry log | Tầng 4 | 🟡 Khuyên dùng |
