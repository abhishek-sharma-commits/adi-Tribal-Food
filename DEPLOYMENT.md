# Deploying Adi Food

This guide describes what the code needs in production. **It has not been exercised on a real server**: the application was tested against a MongoDB-compatible database (FerretDB), a simulated ImageKit, and jsdom. Treat the first deployment as a staging run and use the checklist at the end.

## What you need
| Piece | Notes |
|---|---|
| Node.js 18.18+ | runs the API (`backend/`) |
| MongoDB | Atlas or self-hosted. Indexes are created automatically on first start |
| ImageKit account | stores all photos and videos |
| A web server / reverse proxy with HTTPS | serves the built frontend and proxies `/api` to Node |
| A domain name and TLS certificate | the session cookie is `Secure` in production, so HTTPS is mandatory |

## 1. Recommended layout: one origin
Serve the frontend and the API from the **same domain** (e.g. `https://adifood.example`), with the proxy forwarding `/api/*` to Node. This keeps cookies simple (`SameSite=Lax`) and needs no CORS. Only choose a split-domain setup if you must (see "Different domains" below).

## 2. Backend
```
cd backend
cp .env.example .env          # then edit (below)
npm ci --omit=dev             # or: npm install --omit=dev
npm run seed                  # categories + first admin
npm start                     # node src/server.js
```
Run it under a process manager (systemd, pm2, a container). It shuts down cleanly on `SIGTERM`. `GET /api/health` returns `{ success: true }` for monitoring.

### Backend environment
| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` (enables `Secure` cookies, hides internal error messages) |
| `PORT` | e.g. `5000` (only the proxy should reach it) |
| `MONGODB_URI` | your connection string, with a dedicated database user |
| `JWT_SECRET` | random, at least 32 characters: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `SESSION_DAYS` | session length, default `7` |
| `CLIENT_ORIGIN` | your public site origin, e.g. `https://adifood.example` (comma-separate several) |
| `COOKIE_SAME_SITE` | `lax` for the one-origin layout |
| `TRUST_PROXY` | number of proxies in front of Node (`1` behind a single nginx). **Required for correct per-client rate limiting** |
| `BCRYPT_ROUNDS` | `12` (default) |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | from the ImageKit dashboard. The private key stays on the server only |
| `MEDIA_MAX_IMAGE_MB`, `MEDIA_MAX_VIDEO_MB` | upload limits, default `10` / `100` |
| `MEDIA_URL_PREFIX` | optional extra allowed media URL prefixes (the ImageKit endpoint is added automatically) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | used **only** by `npm run seed` to create the first admin (password at least 12 characters) |

After the first admin exists, **remove `ADMIN_PASSWORD` from the environment**. The seed script never changes an existing user.

## 3. Frontend
```
cd frontend
cp .env.example .env          # build-time settings
npm ci
npm run build                 # outputs frontend/dist
```
| Variable (build time) | Purpose |
|---|---|
| `VITE_API_BASE_URL` | leave **empty** in the one-origin layout (the app calls `/api`) |
| `VITE_HERO_IMAGE_URL` | optional homepage photograph. Use an image you are licensed to use; none is bundled |
| `VITE_CONTACT_EMAIL` | shown on the Contact and Privacy pages. If empty, those pages say contact details are not set up |

Serve `dist/` as static files with a **fallback to `index.html`** for unknown paths (the app uses client-side routing).

## 4. Reverse proxy (nginx example, untested here)
```nginx
server {
  listen 443 ssl http2;
  server_name adifood.example;
  # ssl_certificate / ssl_certificate_key ...

  root /var/www/adi-food/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
  location / { try_files $uri /index.html; }
}
```
The API sets its own security headers (helmet). Add equivalent headers (and a Content-Security-Policy that allows images and video from your ImageKit endpoint) for the static site at the proxy.

## 5. ImageKit
1. Create an account and note the **public key**, **private key** and **URL endpoint**.
2. Uploads go from the browser straight to ImageKit using short-lived signatures from `POST /api/media/upload-auth`.
   - Community uploads are currently paused; official uploads land in `/adi-food/official/`.
3. The server checks every submitted file with ImageKit (folder, type, size) and deletes files that fail the checks. It also deletes files when their record is deleted or replaced.
4. Do not enable public-write settings on the account beyond what ImageKit's signed uploads require.

## 6. Different domains (only if unavoidable)
Set `CLIENT_ORIGIN` to the frontend origin, `COOKIE_SAME_SITE=none`, build the frontend with `VITE_API_BASE_URL=https://api.example/api`, and serve both over HTTPS. Browsers increasingly restrict third-party cookies, so this layout can break sign-in; prefer one origin.

## 7. Operations
- **Backups:** back up MongoDB regularly. Media lives in ImageKit.
- **Secrets:** keep `.env` out of version control and rotate `JWT_SECRET` if it leaks (everyone is signed out).
- **Logs:** the API logs errors to stdout. Collect them with your process manager.
- **Rate limits** (sign-in, registration, uploads, password changes) are held in each Node process's memory. With **more than one** instance, limits apply per instance; use a shared store before scaling out.
- **Updating:** `git pull`, `npm ci`, rebuild the frontend, restart the API. Indexes are created on start.

## 8. Known gaps to decide on before launch
- There is **no password-reset or email-verification flow** (the app sends no email).
- There is **no self-service account deletion**; the Privacy Policy tells users to contact you. You can remove a user directly in the database.
- Profile photos are not supported (the `profileImageUrl` field exists but nothing uploads to it).
- The Privacy Policy and Terms of Use are plain-language drafts. Have them reviewed for the places you operate.
- Cover images are cleaned up when replaced or deleted, but images inserted *inside* a story's body are not tracked for deletion.

## 9. First-deployment checklist
1. `GET https://your-site/api/health` returns success; the site loads and deep links (e.g. `/recipes`) work after a refresh.
2. Register a test user; confirm the cookie is `Secure`, `HttpOnly`, and you stay signed in.
3. Log in as the seeded admin; open `/admin`.
4. Upload a photo as the test user: it should appear as **pending**, not in the gallery.
5. Approve it as admin: it appears in the gallery. Reject (unpublish) it: it disappears. Delete it: confirm the file is gone from ImageKit.
6. Create a recipe with a cover, publish it, view it signed out, unpublish it.
7. Check that a regular user cannot open `/admin` and gets `403` from `/api/admin/*`.
8. Try several wrong passwords: you should be rate limited (confirms `TRUST_PROXY` is correct).
9. Optional, **on a development database only**: `backend/tests/e2e.mjs` runs an end-to-end check against a running API (see the backend README). It creates data.
