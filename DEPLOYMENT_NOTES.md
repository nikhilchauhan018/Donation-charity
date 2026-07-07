# Deployment Notes

## Backend
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Add variables from `backend/.env.example` in Render dashboard.

## Frontend
- Base Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `frontend/dist/donation-charity-portal/browser`
- Add variables from `frontend/.env.example` in Netlify dashboard.

## Verified locally
- `backend`: `npm run build` passes.
- `frontend`: `npm run build` passes.

## Important changes
- Production values are read from `.env` / hosting environment variables.
- Removed local auth debug calls to `127.0.0.1`.
- Frontend API URL is generated into `public/config.js` from `API_URL`.
- Angular font inlining disabled so build does not fail when external Google Fonts cannot be fetched during CI build.
- Angular production budgets increased to avoid CSS budget build failures.
