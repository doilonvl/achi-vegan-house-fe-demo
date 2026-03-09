# Achi Vegan House — Backend API Reference (cho Frontend)

> Tài liệu này mô tả toàn bộ API đã hoàn thiện ở backend để FE tích hợp.
> Base URL production: `https://achiveganhouse.com` (hoặc URL Render deploy)
> API prefix: `/api/v1`
> Swagger UI: `GET /api-docs`
> Health check: `GET /healthz` → `{ ok: true }`

---

## Mục lục

1. [Auth](#1-auth)
2. [Reservation Requests](#2-reservation-requests)
3. [Testimonials](#3-testimonials)
4. [Media Assets](#4-media-assets)
5. [Blogs (Admin)](#5-blogs-admin)
6. [Blogs (Public)](#6-blogs-public)
7. [Upload](#7-upload)
8. [Cơ chế Auth Cookie](#cơ-chế-auth-cookie)
9. [i18n / Localization](#i18n--localization)
10. [Format lỗi](#format-lỗi-chung)

---

## 1. Auth

> Prefix: `/api/v1/auth`

### POST `/api/v1/auth/login`
Đăng nhập admin. Trả về cookie `access_token` + `refresh_token` (httpOnly).

**Body:**
```json
{
  "email": "admin@achiveganhouse.com",
  "password": "secret"
}
```

**Response 200:**
```json
{
  "id": "...",
  "email": "admin@achiveganhouse.com",
  "fullName": "Admin Name",
  "role": "admin"
}
```

**Errors:** `401` invalid credentials, `403` account inactive

---

### GET `/api/v1/auth/me`
Lấy thông tin user đang đăng nhập. Yêu cầu cookie `access_token`.

**Response 200:** (cùng shape với login)
```json
{
  "id": "...",
  "email": "...",
  "fullName": "...",
  "role": "admin"
}
```

---

### POST `/api/v1/auth/logout`
Xóa cookie auth.

**Response 200:** `{ "message": "Logged out" }`

---

### POST `/api/v1/auth/refresh`
Lấy `access_token` mới từ `refresh_token`.
Token có thể gửi qua cookie `refresh_token` **hoặc** body `{ "refreshToken": "..." }`.

**Response 200:** `{ "accessToken": "..." }` + set lại cookie mới

---

## 2. Reservation Requests

> Prefix: `/api/v1/reservation-requests`

### POST `/api/v1/reservation-requests`
Gửi đặt bàn (public, không cần auth). **Rate limit: 5 requests / 10 phút / IP.**

**Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567",
  "email": "a@gmail.com",       // optional
  "guestCount": 4,              // 1–100
  "reservationDate": "2025-06-15",
  "reservationTime": "18:30",
  "note": "Cần bàn yên tĩnh",  // optional, max 1000 chars
  "source": "website"           // "website"|"phone"|"walk_in"|"other", default: "website"
}
```

> **Honeypot:** Nếu form FE có field ẩn tên `website`, backend sẽ silently reject bot (trả 202 Accepted).

**Response 201:**
```json
{
  "message": "Submitted",
  "id": "...",
  "status": "new"
}
```

---

### GET `/api/v1/reservation-requests` *(Admin)*
Danh sách đặt bàn. Yêu cầu cookie auth.

**Query params:**
| Param | Type | Mô tả |
|-------|------|--------|
| `page` | number | default 1 |
| `limit` | number | default 20 |
| `q` | string | tìm kiếm tên/phone |
| `status` | string | `new`/`emailed`/`confirmed`/`cancelled` |
| `dateFrom` | string | YYYY-MM-DD |
| `dateTo` | string | YYYY-MM-DD |

**Response 200:**
```json
{
  "items": [ ...ReservationRequest ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/v1/reservation-requests/:id` *(Admin)*
Chi tiết một đặt bàn.

---

### PATCH `/api/v1/reservation-requests/:id/status` *(Admin)*
Cập nhật trạng thái.

**Body:** `{ "status": "confirmed" }` — enum: `new | emailed | confirmed | cancelled`

---

### ReservationRequest Schema
```typescript
{
  _id: string
  fullName: string
  phoneNumber: string
  email?: string
  guestCount: number
  reservationDate: Date     // ISO string
  reservationTime: string   // "HH:MM"
  note?: string
  source: "website" | "phone" | "walk_in" | "other"
  status: "new" | "emailed" | "confirmed" | "cancelled"
  emailedAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

---

## 3. Testimonials

> Prefix: `/api/v1/testimonials`

### GET `/api/v1/testimonials`
Danh sách testimonial **public** (chỉ active).

**Query params:** `page`, `limit`

**Response:**
```json
{
  "items": [ ...Testimonial ],
  "total": 10
}
```

---

### GET `/api/v1/testimonials/:id`
Chi tiết testimonial public.

---

### GET `/api/v1/testimonials/admin` *(Admin)*
Danh sách toàn bộ (bao gồm inactive).

---

### GET `/api/v1/testimonials/admin/:id` *(Admin)*
Chi tiết (admin view).

---

### POST `/api/v1/testimonials` *(Admin)*
Tạo mới.

**Body:**
```json
{
  "quote_i18n": { "vi": "...", "en": "..." },
  "rating": 5,
  "authorName": "Nguyễn Thị B",
  "authorRole_i18n": { "vi": "Khách hàng", "en": "Customer" },  // optional
  "avatarInitials": "NB",           // optional, max 6 chars
  "avatarAssetId": "mediaAssetId",  // optional
  "mediaAssetIds": ["id1"],         // optional
  "source": "google",               // "google"|"facebook"|"website"|"other"
  "isFeatured": false,
  "isActive": true,
  "sortOrder": 0
}
```

---

### PATCH `/api/v1/testimonials/:id` *(Admin)*
Cập nhật (partial, gửi field nào update field đó).

---

### DELETE `/api/v1/testimonials/:id` *(Admin)*

---

### Testimonial Schema
```typescript
{
  _id: string
  slug: string           // auto-generated
  quote_i18n: { vi: string; en: string }
  rating: number         // 1–5
  authorName: string
  authorRole_i18n?: { vi: string; en: string }
  avatarInitials?: string
  avatarAssetId?: string
  mediaAssetIds: string[]
  source: "google" | "facebook" | "website" | "other"
  isFeatured: boolean
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
```

---

## 4. Media Assets

> Prefix: `/api/v1/media-assets`

### GET `/api/v1/media-assets`
Danh sách media public (chỉ active).

---

### GET `/api/v1/media-assets/:id`
Chi tiết public.

---

### GET `/api/v1/media-assets/admin` *(Admin)*
Toàn bộ (bao gồm inactive).

---

### GET `/api/v1/media-assets/admin/:id` *(Admin)*

---

### POST `/api/v1/media-assets` *(Admin)*
Tạo mới record media (sau khi đã upload lên Cloudinary qua `/api/v1/upload`).

**Body:**
```json
{
  "kind": "image",          // "image"|"video"
  "provider": "cloudinary", // "cloudinary"|"vdrive"|"s3"|"other"
  "url": "https://res.cloudinary.com/...",
  "publicId": "achi/...",   // optional
  "folder": "achi",         // optional
  "format": "webp",         // optional
  "width": 1920,            // optional
  "height": 1080,           // optional
  "bytes": 204800,          // optional
  "alt_i18n": { "vi": "...", "en": "..." },      // optional
  "caption_i18n": { "vi": "...", "en": "..." },  // optional
  "tags": ["hero", "homepage"],   // optional
  "sortOrder": 0,
  "isActive": true
}
```

---

### PATCH `/api/v1/media-assets/:id` *(Admin)*
Cập nhật partial.

---

### DELETE `/api/v1/media-assets/:id` *(Admin)*

---

### MediaAsset Schema
```typescript
{
  _id: string
  slug: string              // auto-generated
  kind: "image" | "video"
  provider: "cloudinary" | "vdrive" | "s3" | "other"
  url: string
  publicId?: string
  folder?: string
  format?: string
  width?: number
  height?: number
  bytes?: number
  alt_i18n?: { vi: string; en: string }
  caption_i18n?: { vi: string; en: string }
  tags?: string[]
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

---

## 5. Blogs (Admin)

> Prefix: `/api/v1/blogs` — **Toàn bộ yêu cầu auth admin**

### GET `/api/v1/blogs`
Danh sách blog (admin).

**Query params:**
| Param | Type | Mô tả |
|-------|------|--------|
| `page` | number | default 1 |
| `limit` | number | default 20 |
| `q` | string | full-text search |
| `status` | string | `draft`/`published`/`scheduled`/`archived`/`all` |
| `tag` | string | lọc theo tag |
| `sort` | string | `updatedAt`/`-updatedAt`/`publishedAt`/`-publishedAt`/`sortOrder`/`-sortOrder` |
| `withCount` | boolean | default true |
| `locale` | string | `vi`/`en` — nếu gửi thì localize kết quả |

**Response:**
```json
{
  "items": [ ...Blog ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/v1/blogs/:id`
Chi tiết blog (admin view, full i18n fields).

---

### POST `/api/v1/blogs`
Tạo blog mới.

**Body:**
```json
{
  "slug_i18n": { "vi": "mon-chay-mua-he", "en": "summer-vegan-dishes" },
  "title_i18n": { "vi": "Món chay mùa hè", "en": "Summer Vegan Dishes" },
  "excerpt_i18n": { "vi": "...", "en": "..." },  // optional
  "content_i18n": {                               // JSON (Tiptap/ProseMirror doc)
    "vi": { "type": "doc", "content": [] },
    "en": { "type": "doc", "content": [] }
  },
  "coverImage": {
    "url": "https://...",
    "publicId": "achi/...",
    "alt_i18n": { "vi": "...", "en": "..." }
  },
  "gallery": [],                     // optional
  "tags": ["chay", "mùa hè"],        // optional
  "status": "draft",                 // "draft"|"published"|"scheduled"|"archived"
  "publishedAt": null,               // ISO string hoặc null
  "scheduledAt": null,               // ISO string hoặc null
  "isFeatured": false,
  "sortOrder": 0,
  "seoTitle_i18n": { "vi": "...", "en": "..." },          // optional
  "seoDescription_i18n": { "vi": "...", "en": "..." },    // optional
  "canonicalUrl": "https://...",     // optional
  "ogImageUrl": "https://...",       // optional
  "robots": { "index": true, "follow": true }  // optional
}
```

> Content size limit: **2MB** per language. `content_i18n` phải là JSON object (Tiptap ProseMirror doc).

**Errors:** `409` slug đã tồn tại, `413` content quá lớn

---

### PUT / PATCH `/api/v1/blogs/:id`
Cập nhật blog (partial OK với PATCH, cùng shape với POST).

---

### DELETE `/api/v1/blogs/:id`
Soft delete (không xóa khỏi DB, set `deletedAt`).

---

### PATCH `/api/v1/blogs/:id/publish`
Publish ngay (set `status: "published"`, `publishedAt: now`).

---

### PATCH `/api/v1/blogs/:id/archive`
Archive blog.

---

### PATCH `/api/v1/blogs/:id/schedule`
Lên lịch đăng.

**Body:** `{ "scheduledAt": "2025-07-01T09:00:00Z" }`

---

### Blog Schema (full, admin view)
```typescript
{
  _id: string
  slug: string                        // canonical slug (vi hoặc en)
  slug_i18n: { vi: string; en: string }
  title_i18n: { vi: string; en: string }
  excerpt_i18n?: { vi: string; en: string }
  content_i18n: { vi: object; en: object }  // Tiptap JSON doc
  coverImage?: {
    url: string
    publicId?: string
    alt_i18n?: { vi: string; en: string }
  }
  gallery?: Array<{
    url: string
    publicId?: string
    alt_i18n?: { vi: string; en: string }
    caption_i18n?: { vi: string; en: string }
  }>
  tags?: string[]
  status: "draft" | "published" | "scheduled" | "archived"
  publishedAt?: Date | null
  scheduledAt?: Date | null
  isFeatured: boolean
  sortOrder: number
  seoTitle_i18n?: { vi: string; en: string }
  seoDescription_i18n?: { vi: string; en: string }
  canonicalUrl?: string
  ogImageUrl?: string
  robots?: { index: boolean; follow: boolean }
  toc_i18n: { vi: TocItem[]; en: TocItem[] }
  plainText_i18n: { vi: string; en: string }
  readingTimeMinutes: number
  stats: { viewCount: number }
  authorName: string
  createdAt: Date
  updatedAt: Date
  // Computed fields (khi gửi locale header):
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
}
```

---

## 6. Blogs (Public)

> Prefix: `/api/v1/public/blogs` — **Không cần auth, chỉ trả published blogs**

### GET `/api/v1/public/blogs`
Danh sách blog đã published (no content, no toc, no plainText).

**Query params:**
| Param | Type | Mô tả |
|-------|------|--------|
| `page` | number | default 1 |
| `limit` | number | default 20 |
| `tag` | string | lọc tag |
| `sort` | string | `publishedAt`/`-publishedAt`/`sortOrder`/`-sortOrder` |
| `locale` | string | `vi`/`en` — localize response |

**Response:**
```json
{
  "items": [
    {
      "_id": "...",
      "slug": "mon-chay-mua-he",
      "title": "Món chay mùa hè",      // đã localize nếu gửi locale
      "excerpt": "...",
      "coverImage": { "url": "...", "alt": "..." },
      "tags": ["chay"],
      "publishedAt": "2025-06-01T00:00:00Z",
      "readingTimeMinutes": 3,
      "stats": { "viewCount": 120 },
      "metaTitle": "...",
      "metaDescription": "...",
      "ogImage": "..."
    }
  ],
  "total": 30,
  "page": 1,
  "limit": 20
}
```

---

### GET `/api/v1/public/blogs/:slug`
Chi tiết blog theo slug (có `content`, `toc`, `plainText`). Slug có thể là vi hoặc en.

**Response:** Blog object đã localize + đầy đủ content.

---

### POST `/api/v1/public/blogs/:id/view`
Tăng view count.

**Response:** `{ "viewCount": 121 }`

---

## 7. Upload

> Prefix: `/api/v1/upload` — **Yêu cầu auth admin**

### POST `/api/v1/upload/single`
Upload 1 file lên Cloudinary. Gửi `multipart/form-data`, field tên `file`.

**Response:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "achi/abc123",
  "format": "webp",
  "width": 1920,
  "height": 1080,
  "bytes": 204800
}
```

---

### POST `/api/v1/upload/multi`
Upload nhiều file. Gửi `multipart/form-data`, field tên `files[]`.

**Response:** Array của upload results.

---

## Cơ chế Auth Cookie

- Backend set 2 cookie httpOnly sau khi login:
  - `access_token`: JWT ngắn hạn (~15 phút)
  - `refresh_token`: JWT dài hạn (~7 ngày)
- FE **phải** gửi `credentials: "include"` (fetch) hoặc `withCredentials: true` (axios) với mọi request cần auth.
- Khi nhận `401`, gọi `POST /api/v1/auth/refresh` để lấy token mới, sau đó retry.
- Không cần set header `Authorization` — backend đọc từ cookie.

**CORS:** Backend whitelist origin qua env `CORS_ORIGINS`. FE domain phải được add vào đây.

---

## i18n / Localization

Backend hỗ trợ **vi** và **en**.

### Cách gửi locale từ FE:

**Cách 1 (khuyên dùng):** Query param `?locale=vi` hoặc `?locale=en`

**Cách 2:** Header `Accept-Language: vi` hoặc `Accept-Language: en`

### Hành vi khi có locale:
- Các field `*_i18n` (title, excerpt, quote, alt, caption, ...) sẽ được flatten:
  - `title_i18n: { vi: "...", en: "..." }` → `title: "..."` (theo locale)
  - `slug_i18n` bị loại bỏ khỏi response, `slug` sẽ là slug theo locale
- `content_i18n` được flatten thành `content` (chỉ ở public blog detail)
- `toc_i18n` → `toc`, `plainText_i18n` → `plainText`

### Hành vi khi không có locale:
- Response trả full object với tất cả `*_i18n` fields
- FE tự xử lý chọn ngôn ngữ

---

## Format lỗi chung

```json
{ "message": "Mô tả lỗi" }
```

| Status | Ý nghĩa |
|--------|---------|
| `400` | Validation error / bad request |
| `401` | Chưa đăng nhập / token invalid |
| `403` | Không có quyền |
| `404` | Không tìm thấy |
| `409` | Conflict (ví dụ: slug trùng) |
| `413` | Content quá lớn |
| `429` | Rate limit (reservation) |
| `500` | Internal server error |

---

## Tóm tắt Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/healthz` | - | Health check |
| GET | `/api-docs` | - | Swagger UI |
| POST | `/api/v1/auth/login` | - | Đăng nhập |
| GET | `/api/v1/auth/me` | Admin | Thông tin user |
| POST | `/api/v1/auth/logout` | - | Đăng xuất |
| POST | `/api/v1/auth/refresh` | - | Refresh token |
| POST | `/api/v1/reservation-requests` | - | Gửi đặt bàn (rate limited) |
| GET | `/api/v1/reservation-requests` | Admin | Danh sách đặt bàn |
| GET | `/api/v1/reservation-requests/:id` | Admin | Chi tiết đặt bàn |
| PATCH | `/api/v1/reservation-requests/:id/status` | Admin | Cập nhật status |
| GET | `/api/v1/testimonials` | - | Danh sách testimonial public |
| GET | `/api/v1/testimonials/:id` | - | Chi tiết testimonial public |
| GET | `/api/v1/testimonials/admin` | Admin | Toàn bộ testimonial |
| GET | `/api/v1/testimonials/admin/:id` | Admin | Chi tiết (admin) |
| POST | `/api/v1/testimonials` | Admin | Tạo testimonial |
| PATCH | `/api/v1/testimonials/:id` | Admin | Cập nhật |
| DELETE | `/api/v1/testimonials/:id` | Admin | Xóa |
| GET | `/api/v1/media-assets` | - | Danh sách media public |
| GET | `/api/v1/media-assets/:id` | - | Chi tiết media public |
| GET | `/api/v1/media-assets/admin` | Admin | Toàn bộ media |
| GET | `/api/v1/media-assets/admin/:id` | Admin | Chi tiết (admin) |
| POST | `/api/v1/media-assets` | Admin | Tạo media record |
| PATCH | `/api/v1/media-assets/:id` | Admin | Cập nhật |
| DELETE | `/api/v1/media-assets/:id` | Admin | Xóa |
| GET | `/api/v1/blogs` | Admin | Danh sách blog (admin) |
| GET | `/api/v1/blogs/:id` | Admin | Chi tiết blog (admin) |
| POST | `/api/v1/blogs` | Admin | Tạo blog |
| PUT/PATCH | `/api/v1/blogs/:id` | Admin | Cập nhật blog |
| DELETE | `/api/v1/blogs/:id` | Admin | Soft delete |
| PATCH | `/api/v1/blogs/:id/publish` | Admin | Publish |
| PATCH | `/api/v1/blogs/:id/archive` | Admin | Archive |
| PATCH | `/api/v1/blogs/:id/schedule` | Admin | Schedule |
| GET | `/api/v1/public/blogs` | - | Danh sách blog public |
| GET | `/api/v1/public/blogs/:slug` | - | Chi tiết blog public |
| POST | `/api/v1/public/blogs/:id/view` | - | Tăng view count |
| POST | `/api/v1/upload/single` | Admin | Upload 1 file |
| POST | `/api/v1/upload/multi` | Admin | Upload nhiều file |
