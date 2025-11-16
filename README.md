# Time Management Software (TMS)

This repository contains a full-stack Time Management Software application used for scheduling, notifications, and basic executive/secretary workflows.

Contents
- `client/` — Vite + React frontend (JSX/TypeScript mix)
- `backend/` — Express API (routes, controllers, MongoDB schemas)

This README explains how to run the app locally, prepare a production build, and deploy the services. It also documents environment variables, helpful scripts, API examples, and troubleshooting steps.

Quick summary
- Run the backend on port `5000` and the frontend (Vite) on the default Vite port during development.
- In production, set `VITE_API_BASE` in your hosting provider (Vercel) before building the frontend; Vite inlines env vars at build time.

Features
- User authentication (Firebase integration for social sign-in + backend auth routes)
- Event scheduling and conflict detection
- Executive and secretary role-based routes and UI
- Notifications service (server-side notifications and client display)

Tech stack
- Frontend: React, Vite, JSX/TypeScript mix
- Backend: Node.js, Express
- Database: MongoDB (Mongoose schemas in `backend/schema/`)
- Auth: Firebase (used for social auth in client) and backend session/JWT flows

Development setup

Prereqs
- Node.js 18+ and npm
- MongoDB (local or hosted cluster)

Backend
1. Install and run backend:
```powershell
cd backend
npm install
# create a .env with required variables (see sample below)
npm run start
```
2. Verify: visit `http://localhost:5000/` (or check logs) to confirm the server is running.

Frontend
1. Install and run frontend (Vite):
```powershell
cd client
npm install
# optional: for absolute URLs in dev
$env:VITE_API_BASE = "http://localhost:5000"
npm run dev
```
2. Visit the Vite dev URL (typically `http://localhost:5173`) and use the app.

Notes on dev proxy
- The frontend config includes a Vite dev proxy (`client/vite.config.ts`) that proxies `/api/*` to `http://localhost:5000`. Using relative `/api` paths in client code avoids CORS during development.

Build & production

Frontend (build)
1. Ensure `VITE_API_BASE` is set to your backend base URL (e.g. `https://your-backend.onrender.com`). In Vercel, add this under Project → Settings → Environment Variables for Production.
2. Build locally (or in CI):
```powershell
cd client
$env:VITE_API_BASE = "https://your-backend.example.com"
npm run build
```
3. Deploy `client/dist` to a static host (Vercel recommended for this repo).

Backend (deploy)
- Deploy `backend/` to Render, Heroku, or a VPS. Make sure `MONGO_URI`, `PORT`, and other secrets are set as environment variables in your host.

Environment variable examples

Backend `.env` (example)
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/tms
JWT_SECRET=replace-with-secret
SMTP_HOST=smtp.example.com
SMTP_USER=...
SMTP_PASS=...
```

Frontend env (Vite)
```
VITE_API_BASE=https://your-backend.example.com
```

Common npm scripts (project-level)
- Frontend (`client/package.json`)
  - `npm run dev` — start Vite dev server
  - `npm run build` — type-check and build for production (`tsc --noEmit && vite build`)
  - `npm run preview` — preview the built app
- Backend (`backend/package.json`)
  - `npm start` — start the production server
  - `npm run dev` — start server with nodemon (if available)

API endpoints (examples)
- Authentication: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- Events: `GET /api/events`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id`
- Executives: `GET /api/executives`, `POST /api/executives` (see `backend/routes/executives.js`)
- Secretary: `GET /api/secretary/*` (see `backend/routes/secretary.js`)

The exact request shapes are defined in the backend controllers and schemas under `backend/controllers/` and `backend/schema/`.

Troubleshooting

- TS6202 / project references circular graph
  - If CI fails with `TS6202`, avoid `tsc -b` on CI for this repo. Use `tsc --noEmit` for type checking only. This repo's `client` build uses `tsc --noEmit && vite build` to avoid composite reference cycles.

- Deployed frontend still requests `localhost:5000`
  - Vite inlines env values at build time. Make sure `VITE_API_BASE` is set in your deployment host (Vercel) before the build step. Rebuild/redeploy after setting it.

- Firebase `auth/unauthorized-domain`
  - Add your deployed domains (Vercel preview and production domains) to Firebase Console → Authentication → Settings → Authorized domains.

- Browser requests blocked (`net::ERR_BLOCKED_BY_CLIENT`)
  - Check for browser extensions (adblockers) or privacy settings. Test in an incognito window without extensions.

Developer notes & conventions

- JSX in `.js` files: The frontend includes a small Vite plugin to transform JSX inside `.js` files (to avoid mass renames). You can optionally rename those files to `.jsx` or `.tsx` — both are acceptable.
- Centralize API URL usage: the frontend reads the base API URL from `import.meta.env.VITE_API_BASE` where present. Prefer relative `/api` paths in dev to rely on the Vite proxy.

Contributing

- Open a feature branch, push to the origin, and create a pull request to `master`.
- Keep secrets out of source; use environment variables for all credentials.
- Add tests where appropriate. Lint and format before opening a PR.

Next steps I can help with
- Replace remaining hard-coded API URLs in `client/src` with `import.meta.env.VITE_API_BASE` (I already updated `SigninPage.jsx`).
- Create `client/.env.example` and `backend/.env.example` files documenting required env variables.
- Produce a step-by-step deployment checklist for Vercel (frontend) + Render (backend).

Contact / support
- If you want me to make any of the next-step changes, tell me which one and I will implement it.

---
Updated README with expanded documentation and developer guidance.
