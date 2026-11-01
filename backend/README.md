# Adi Food: Backend API

Node.js + Express + MongoDB (Mongoose). Modular monolith: `routes → controllers → services → models`, with validators (Zod) and middleware in front.

## Setup
```
cp .env.example .env     # fill in MONGODB_URI, JWT_SECRET, ImageKit keys
npm install
npm run seed             # 6 default categories + first admin (ADMIN_EMAIL / ADMIN_PASSWORD, min 12 chars)
npm run dev              # or: npm start
```
Requires Node 18.18+. Registration always creates role `user`; the only way to get an admin is `npm run seed`.

### Environment
| Variable | Notes |
|---|---|
| `MONGODB_URI`, `JWT_SECRET` (≥32 chars), `CLIENT_ORIGIN` | required. `CLIENT_ORIGIN` may be a comma-separated list |
| `SESSION_DAYS` | session length, default 7 |
| `COOKIE_SAME_SITE` | `lax` (default), `strict`, or `none` (cross-site frontend; forces `Secure`) |
| `TRUST_PROXY` | reverse-proxy hops, default 0 |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | media uploads. Without them uploads return `503 MEDIA_NOT_CONFIGURED` |
| `MEDIA_URL_PREFIX` | extra allowed media URL prefixes (the ImageKit endpoint is added automatically) |
| `MEDIA_MAX_IMAGE_MB` / `MEDIA_MAX_VIDEO_MB` | default 10 / 100 |

## Conventions
- Success: `{ success: true, data, meta? }`. Error: `{ success: false, error: { code, message, details? } }`.
- Lists are paginated: `?page=1&limit=20`, with `meta: { page, limit, total, totalPages }`.
- **Auth:** HTTP-only session cookie. **CSRF:** every non-GET request needs `X-CSRF-Token`, taken from `GET /api/auth/csrf` (or the login/register response) and sent with `credentials: 'include'`.
- Resources use Mongo `_id`; the auth `user` object uses `id`.
- Permissions are enforced on the server: everything under `/api/admin` sits behind `requireAdmin`, and the user is re-read from the database on each request, so suspensions and role changes apply immediately.

## Endpoints
**Auth** `/api/auth`: `GET /csrf` · `POST /register` · `POST /login` · `POST /logout` · `GET /me` · `PATCH /me` (`{fullName}`) · `PATCH /password` (`{currentPassword, newPassword, confirmPassword}`; signs out all other sessions)

**Public**
- `GET /api/categories`
- `GET /api/recipes` (`q, category(slug), featured, sort=newest|featured`) · `GET /api/recipes/:slug` (includes `related`)
- `GET /api/blogs` (`q, category(slug), tag`) · `GET /api/blogs/:slug` (includes `related`)
- `GET /api/community/gallery` (`q, mediaType, category(slug)`), approved items only
- `GET /api/media` (`featured, mediaType, category(slug)`), published official media only

**Signed-in user**
- `POST /api/media/upload-auth`: signature for a direct browser upload to ImageKit
- `POST /api/community/submissions` · `GET /submissions/mine` (`status, mediaType`; `meta.counts` for dashboard cards) · `GET /submissions/mine/:id` · `PATCH /submissions/:id` · `DELETE /submissions/:id`

**Admin** `/api/admin` (admin role only)
- `recipes`: `GET /`, `POST /`, `GET|PATCH|DELETE /:id`, `PATCH /:id/publish`, `PATCH /:id/feature`
- `blogs`: `GET /`, `POST /`, `GET|PATCH|DELETE /:id` (status via `PATCH`)
- `submissions`: `GET /?status=pending|approved|rejected`, `PATCH /:id/review` (`{status, reason}`; reason required to reject), `DELETE /:id`
- `media`: `GET /`, `POST /`, `GET|PATCH|DELETE /:id`, `PATCH /:id/publish`, `PATCH /:id/feature`
- `categories`: `GET /` (with usage counts), `POST /`, `PATCH /:id`, `DELETE /:id` (refused with `CATEGORY_IN_USE` while any recipe, blog, submission or media uses it)
- `users`: `GET /`, `GET /:id`, `PATCH /:id/status`
- `GET /dashboard`

## Upload flow (ImageKit)
1. `POST /api/media/upload-auth` → `{ uploadUrl, publicKey, token, expire, signature, folder, limits }`.
2. The browser uploads straight to ImageKit with those fields.
3. Submit `{ mediaUrl, mediaFileId, … }` to `/community/submissions` (or `/admin/media` with `purpose: "official"` signing). The server asks ImageKit about the file and checks the folder, URL, MIME type and size before saving. Failing uploads are removed from ImageKit.

## Business rules (enforced server-side)
- Only admins create, edit, publish or delete recipes and blogs. Public queries return published content only.
- Community uploads are separate from recipes. They start `pending`, appear in the gallery only once approved, and never become recipes.
- Users can edit only the metadata of their own pending or rejected submissions. Editing a rejected one re-queues it. Approved ones are locked (delete and resubmit).
- Admins can't change their own status or other admins' status.

## Testing
`tests/e2e.mjs` is a standalone end-to-end check against a **running server and a development database**. It is not used by the app and can be deleted.
```
BASE_URL=http://localhost:5000/api E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... node tests/e2e.mjs
# add E2E_IMAGEKIT=1 to include the real upload → submit → moderate flow
```

## Production notes
- Serve the API and frontend from the same site if possible (or set `COOKIE_SAME_SITE=none` over HTTPS). Set `NODE_ENV=production` and `TRUST_PROXY` to the number of proxies in front.
- Request bodies are limited to 100 KB (media goes directly to ImageKit).
- Run `npm run seed` once; the index definitions are created automatically on first start.
