# Time Management Software (TMS)

Comprehensive full-stack application for scheduling, notifications, and simple executive/secretary workflows.

## Repository contents
| Path | Purpose |
|------|---------|
| `client/` | Vite + React frontend (JSX/TypeScript mix) |
| `backend/` | Express API, controllers, Mongoose schemas |

## Quick summary
- Backend runs on port `5000` in development. Frontend runs on the Vite dev port (default `5173`).
- For production builds of the frontend, set `VITE_API_BASE` in your host (Vercel) before building — Vite inlines env vars at build time.

## Key features
| Feature | Description |
|---|---|
| Authentication | Firebase social sign-in + backend auth routes |
| Scheduling | Create/edit events with basic conflict detection |
| Role-based UI | Executive and Secretary dashboards and APIs |
| Notifications | Server-side notifications and client display panel |

## Tech stack
| Layer | Technology |
|---|---|
| Frontend | React, Vite, JSX + TypeScript |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | Firebase (client) + backend session/JWT flows |

## Project structure (high level)
```
client/            # frontend app (Vite)
backend/           # Express app, routes, controllers
  controllers/
  routes/
  schema/          # Mongoose schemas
javeed.py
README.md
```

## Quick start
1) Start the backend
```powershell
cd backend
npm install
# create a .env (see env examples below)
npm run start
```

2) Start the frontend (dev)
```powershell
cd client
npm install
# optional: set API base if you use absolute URLs in dev
$env:VITE_API_BASE = "http://localhost:5000"
npm run dev
```

Dev notes: `client/vite.config.ts` includes a dev proxy so `/api/*` is forwarded to `http://localhost:5000`. Use relative `/api` requests in client code for convenience.

## Environment variables (recommended table)
| File | Variable | Required | Example / Notes |
|---|---:|---:|---|
| `backend/.env` | `PORT` | no | `5000` (default)
| `backend/.env` | `MONGO_URI` | yes | `mongodb+srv://user:pass@cluster/tms` |
| `backend/.env` | `JWT_SECRET` | yes | secret for signing tokens |
| `backend/.env` | `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | no | for email notifications |
| `client/.env` or Vercel envs | `VITE_API_BASE` | recommended | `https://your-backend.example.com` (must be set before building)

### Sample `.env` (backend)
```text
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/tms
JWT_SECRET=replace_with_secret
```

### Sample Vite env (frontend)
```text
VITE_API_BASE=https://your-backend.example.com
```

Important: Vite envs are inlined at build time. If `VITE_API_BASE` is not set at build time the compiled bundle may include `localhost` or other fallbacks.

## Scripts (at-a-glance)
| Location | Script | Purpose |
|---|---|---|
| `client/package.json` | `dev` | start Vite dev server |
| `client/package.json` | `build` | type-check & build production bundle (`tsc --noEmit && vite build`) |
| `client/package.json` | `preview` | preview the built app |
| `backend/package.json` | `start` | start backend server |
| `backend/package.json` | `dev` | start backend with nodemon (if present) |

## API reference (common endpoints)
| Method | Path | Auth | Description |
|---:|---|---|---|
| POST | `/api/auth/login` | no | Login endpoint (backend auth)
| POST | `/api/auth/register` | no | Register user / create profile
| GET | `/api/auth/me` | yes | Get current authenticated user
| GET | `/api/events` | yes | List events
| POST | `/api/events` | yes | Create event
| PUT | `/api/events/:id` | yes | Update event
| DELETE | `/api/events/:id` | yes | Delete event

### Example curl (login)
```bash
curl -X POST 'https://your-backend.example.com/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret"}'
```

## Deployment checklist (Vercel frontend + Render backend)
| Step | Notes |
|---|---|
| Prepare backend | Deploy `backend/` to Render/Heroku, set `MONGO_URI`, `JWT_SECRET`, SMTP creds, enable HTTPS |
| Backend health | Confirm backend accepts requests from `https://your-backend.example.com` |
| Vercel env | In Vercel Project Settings set `VITE_API_BASE=https://your-backend.example.com` for Production |
| Vercel build | Trigger a new deployment (build runs after envs are set) |
| Firebase | Add Vercel domain(s) to Firebase → Authentication → Authorized domains for social login |
| Test app | Test login, event creation, notifications in production environment |

## Common errors & quick fixes
| Error | Cause | Fix |
|---|---|---|
| `TS6202` project references circular graph | `tsc -b` with project references causing cycle | Use `tsc --noEmit` instead of `tsc -b`. `client` uses `tsc --noEmit && vite build` |
| Frontend still calls `localhost:5000` | `VITE_API_BASE` missing at build time | Add `VITE_API_BASE` in Vercel and redeploy (build inlines envs) |
| `auth/unauthorized-domain` (Firebase) | Deployed domain not added to Firebase | Add domain(s) in Firebase Console → Authentication → Authorized domains |
| `net::ERR_BLOCKED_BY_CLIENT` | Browser extension (adblock) blocked request | Test in incognito with extensions disabled; whitelist domain |

## Developer notes & recommendations
- Centralize API base usage: call `const API_BASE = import.meta.env.VITE_API_BASE || ''` in a small helper and use it in API calls. This avoids scattered hard-coded URLs.
- Long-term: consider renaming JSX-containing `.js` files to `.jsx` or `.tsx` and removing the pre-transform plugin in `vite.config.ts` for clarity.

## Next improvements I can implement
- Replace remaining hard-coded API URLs across `client/src` with `import.meta.env.VITE_API_BASE` (automated changes).
- Add `client/.env.example` and `backend/.env.example` files with required variables and descriptions.
- Add CI config examples (Vercel/GitHub Actions) and a step-by-step deployment script.

## Contact / support
- Tell me which next improvement you want and I will implement it (I can open a PR or push changes directly).

---
Updated README: added tables, examples, and a deployment checklist.

