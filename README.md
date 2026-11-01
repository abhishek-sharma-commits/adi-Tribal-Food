# Adi Food

Platform preserving and showcasing the traditional food culture of the Adi tribe of Arunachal Pradesh.

```
adi-food/
  backend/    Node + Express + MongoDB API   (see backend/README.md for the full API reference)
  frontend/   React + Vite + Tailwind web app
```

Deploying: see [DEPLOYMENT.md](DEPLOYMENT.md).

## Run locally
1. **Backend**
   ```
   cd backend
   cp .env.example .env        # set MONGODB_URI, JWT_SECRET (and ImageKit keys for uploads)
   npm install
   npm run seed                # default categories + first admin (ADMIN_EMAIL / ADMIN_PASSWORD)
   npm run dev                 # http://localhost:5000
   ```
2. **Frontend** (in a second terminal)
   ```
   cd frontend
   npm install
   npm run dev                 # http://localhost:5173  (Vite proxies /api to the backend)
   ```

## Status
| Area | State |
|---|---|
| Backend API (auth, recipes, blogs, community uploads, moderation, official media, users, dashboard) | complete |
| Frontend: design system, API client, auth, homepage, Explore Recipes, Recipe Details, Stories (blog list + detail), Community Gallery, upload flow | complete |
| Frontend: user dashboard (overview, my uploads with edit/delete/rejection reasons, upload, profile + password) | complete |
| Frontend: admin dashboard: layout, overview stats, community moderation queue, user management, recipe management (list, create/edit form with uploads, preview, publish, feature, delete), story/blog management (rich-text editor, tags, cover upload, preview, publish, archive, delete) | complete |
| Frontend: admin official-media management (upload, details, publish, feature, delete) with featured media on the homepage, and category management (create, edit, usage counts, protected delete) | complete |
| Frontend: About, Community Guidelines, Contact, Privacy Policy and Terms pages (drafts; see DEPLOYMENT.md) | complete |

`backend/tests/e2e.mjs` is an optional end-to-end check you can run against your own database. Nothing in the app imports it; delete it freely.

Notes: no photography is bundled. Set `VITE_HERO_IMAGE_URL` (frontend) to an image you are licensed to use.
