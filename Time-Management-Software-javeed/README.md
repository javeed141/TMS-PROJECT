# Time Management Software (TMS)

This repository contains a full-stack Time Management Software app:

- `client/` — Vite + React (TypeScript/JSX) frontend
- `backend/` — Express + MongoDB backend API

This README explains how to run the project locally, build for production, and deploy (Vercel for frontend, Render or similar for backend). It also documents the environment variables and common troubleshooting steps.

Quick summary: run backend on port `5000` and frontend (Vite) on default port (e.g. `5173`) during development. In production, set `VITE_API_BASE` to your backend URL before building the frontend so the compiled bundle calls the correct API.

**Repository structure**
- `client/` — frontend source and build pipeline (Vite)
- `backend/` — Express API, routes and controllers

**Prerequisites**
- Node.js 18+ and npm
- MongoDB instance (local or hosted)

**Environment variables**

Backend (`backend/.env`)
- `PORT` — port for backend (default `5000`)
- `MONGO_URI` — MongoDB connection string
- Any other secret keys used by the backend (JWT secret, SMTP, etc.)

Frontend (`client/.env` or Vercel envs)
- `VITE_API_BASE` — Base URL for API (e.g. `https://your-backend.onrender.com`). If empty, the client will use relative `/api` requests (useful with Vite proxy in dev).

Note: Vite env vars must begin with `VITE_` and are inlined at build time. Set `VITE_API_BASE` in your deployment service (Vercel) before building.

Local development

1. Backend
   - Install and start backend:
     ```powershell
     cd backend
     npm install
     # create .env with MONGO_URI and other secrets
     npm run start
     ```
   - Visit `http://localhost:5000/` to verify the server is running.

2. Frontend
   - Install and start frontend (Vite):
     ```powershell
     cd client
     npm install
     # optionally set API base for dev if you want absolute URLs:
     $env:VITE_API_BASE = "http://localhost:5000"
     npm run dev
     ```
   - The repo includes a Vite dev server proxy (see `client/vite.config.ts`) which proxies `/api/*` to `http://localhost:5000` during development. Using relative `/api` requests in the app will avoid CORS issues in dev.

Build for production (frontend)

1. Set `VITE_API_BASE` to your production backend URL (or leave empty and use same-origin routing if frontend and backend share a domain).
   - In Vercel, add `VITE_API_BASE` under Project → Settings → Environment Variables (Production)
2. Build:
   ```powershell
   cd client
   $env:VITE_API_BASE = "https://your-backend.example.com"
   npm run build
   ```

Deployment notes

- Frontend: deploy `client` to Vercel. Make sure the `VITE_API_BASE` env var is set in Vercel for the Production environment before the build runs.
- Backend: deploy `backend` to Render, Heroku, or similar. Ensure your service is reachable via an HTTPS URL.
- Firebase: for Google sign-in, add your frontend domain(s) (production and preview) to Firebase Console → Authentication → Settings → Authorized domains.

Common issues & troubleshooting

- Error: `TS6202: Project references may not form a circular graph`
  - Cause: `tsc -b` (composite build) following `references` in tsconfig can cause cycles in nested configs. Fix: use `tsc --noEmit` in the `client` build script to perform type checking without composite project builds. This repo already uses `tsc --noEmit && vite build`.

- Error: `net::ERR_BLOCKED_BY_CLIENT` during API calls
  - Cause: Browser extension (adblock/privacy) or service worker blocked the request. Test in an incognito window with extensions disabled. If extension blocks calls, add an exception for your domain.

- Error: frontend calling `http://localhost:5000` after deployment
  - Cause: Vite inlines environment variables at build time. If you build the frontend without `VITE_API_BASE` set (or code falls back to `localhost`), the compiled bundle will contain `localhost`. Solution: set `VITE_API_BASE` in Vercel project envs and redeploy so the bundle references the correct backend.

- Error: `Firebase: Error (auth/unauthorized-domain)` on Google sign-in
  - Cause: Your deployed domain is not added to Firebase Authorized Domains. Fix: add your Vercel domain(s) and any local dev origins (e.g. `localhost`) in Firebase Console → Authentication → Settings → Authorized domains.

Other notes

- The frontend contains a small Vite plugin in `vite.config.ts` to handle JSX inside `.js` files without renaming all files to `.jsx` — this was added to avoid mass renames while preserving build compatibility.
- If you prefer, you can rename JSX-containing `.js` files to `.jsx` and remove the pre-transform plugin; both approaches are valid. Using `.jsx` is the more conventional approach.

Contributing

- Make changes in feature branches and create a pull request to `master`.
- Keep environment-specific secrets out of the repo and set them in your deployment provider.

License

- This repository does not include an explicit license file. Add `LICENSE` if you want to set a license.

If you want, I can also:
- Replace remaining hard-coded API URLs in `client/src` with `import.meta.env.VITE_API_BASE` (I started converting `SigninPage.jsx`),
- Create a small `client/.env.example` and `backend/.env.example` to document required environment variables,
- Or create a deployment checklist file for Vercel + Render.

---
Happy to make any of the optional changes — tell me which one to do next.
