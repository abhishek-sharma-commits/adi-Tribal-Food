# Adi Food: Backend API

Node.js + Express + MongoDB (Mongoose). Modular monolith: `routes → controllers → services → models`, with validators (Zod) and middleware in front.

Stories and community features are temporarily disabled: their route groups are not mounted, and community-purpose upload signatures are rejected. Their implementation and stored data are retained for a later release.

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
- Stories: `GET /api/blogs` (`q, category(slug), tag`) · `GET /api/blogs/:slug` (paused)
- Community: `GET /api/community/gallery` (`q, mediaType, category(slug)`) (paused)
- `GET /api/media` (`featured, mediaType, category(slug)`), published official media only

**Signed-in user**
- `POST /api/media/upload-auth`: signature for a direct browser upload to ImageKit (official media only)
- Community submissions and upload flow: paused

**Admin** `/api/admin` (admin role only)
- `recipes`: `GET /`, `POST /`, `GET|PATCH|DELETE /:id`, `PATCH /:id/publish`, `PATCH /:id/feature`
- `blogs`: story management endpoints (paused)
- `submissions`: community moderation endpoints (paused)
- `media`: `GET /`, `POST /`, `GET|PATCH|DELETE /:id`, `PATCH /:id/publish`, `PATCH /:id/feature`
- `categories`: `GET /` (with usage counts), `POST /`, `PATCH /:id`, `DELETE /:id` (refused with `CATEGORY_IN_USE` while any recipe, blog, submission or media uses it)
- `users`: `GET /`, `GET /:id`, `PATCH /:id/status`
- `GET /dashboard`

## Upload flow (ImageKit)
1. `POST /api/media/upload-auth` → `{ uploadUrl, publicKey, token, expire, signature, folder, limits }`.
2. The browser uploads straight to ImageKit with those fields.
3. For official media, submit `{ mediaUrl, mediaFileId, … }` to `/admin/media` with `purpose: "official"` signing. Community submissions are paused. The server asks ImageKit about the file and checks the folder, URL, MIME type and size before saving. Failing uploads are removed from ImageKit.

## Business rules (enforced server-side)
- Stories and community submission rules remain in source but are inactive until those features are re-enabled.
- Only admins create, edit, publish or delete recipes. Public recipe queries return published content only.
- Users can edit only the metadata of their own pending or rejected submissions. Editing a rejected one re-queues it. Approved ones are locked (delete and resubmit).
- Admins can't change their own status or other admins' status.

## Testing
`tests/e2e.mjs` is a standalone end-to-end check against a **running server and a development database**. It is not used by the app and can be deleted.
```
BASE_URL=http://localhost:5000/api E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... node tests/e2e.mjs
```

## Production notes
- Serve the API and frontend from the same site if possible (or set `COOKIE_SAME_SITE=none` over HTTPS). Set `NODE_ENV=production` and `TRUST_PROXY` to the number of proxies in front.
- Request bodies are limited to 100 KB (media goes directly to ImageKit).
- Run `npm run seed` once; the index definitions are created automatically on first start.
