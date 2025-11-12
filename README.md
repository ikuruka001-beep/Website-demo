# Ikuruka - TravelPR (Starter)

This repo contains a starter backend (Node/Express) and a simple React frontend for Ikuruka — a travel & destination PR SaaS.

## What you get
- `server/` - Express backend with Stripe, SendGrid, NewsAPI wiring and Postgres persistence.
- `server/migrations/001_init.sql` - SQL migration to create tables.
- `frontend/` - Minimal React app wired to backend endpoints.

## Quickstart (local)
1. Install Postgres and create a database `ikuruka` or set `DATABASE_URL`.
2. Backend:
   ```
   cd /path/to/ikuruka-tr
   npm install
   cp .env.example .env
   # edit .env with real keys
   npm run migrate
   npm run dev
   ```
3. Frontend:
   ```
   cd frontend
   npm install
   npm run start
   ```
   Make sure frontend dev server proxies `/api` to backend or run frontend as static build served by backend in production.

## Deployment to GoDaddy (Guide)
GoDaddy typically offers cPanel shared hosting and a separate "Applications" or VPS. For Node apps, preferred options:
1. **Use a VPS / Cloud Server** (recommended):
   - Purchase a Linux VPS from GoDaddy.
   - SSH in, install Node.js (LTS), Postgres, and PM2.
   - Clone the repo, `npm install`, set environment variables in `~/.env` or systemd/pm2.
   - Run migrations: `node server/migrate.js`.
   - Start the app with PM2: `pm2 start server/index.js --name ikuruka`.
   - Configure nginx (or the VPS firewall) to reverse proxy port 80 to your Node app port (4000).
   - Obtain TLS cert via Certbot (Let's Encrypt) and configure nginx.
   - For the frontend, build `npm run build` in `frontend` and configure nginx to serve the `dist` folder or host it as static on a CDN.

2. **Use GoDaddy's cPanel (shared)**
   - cPanel shared hosting rarely supports long-running Node processes. Use this approach only if GoDaddy offers "Node.js App" in cPanel:
     - In cPanel, create a Node.js application, upload the repo or `build` output.
     - Set environment variables in the Node.js app settings.
     - Use the cPanel Node app manager to start the server.
     - For Postgres, cPanel may provide a database service; otherwise use a managed Postgres elsewhere (Heroku/ElephantSQL).

3. **Alternative: Deploy backend to Railway / Heroku / Render and static frontend to GoDaddy**
   - Deploy backend to Railway/Render/Heroku (they provide easy Postgres addons).
   - Build frontend and host static files on GoDaddy or Netlify/Vercel for CDN and TLS.
   - Configure environment variables (Stripe keys, SendGrid).

## Stripe webhooks
- Create a webhook endpoint in the Stripe Dashboard pointing to `https://your-domain/webhook`.
- Set `STRIPE_WEBHOOK_SECRET` in `.env` to the signing secret from Stripe.
- Use `stripe listen --forward-to localhost:4000/webhook` during local dev.

## Notes
- This is a starter. Replace in-memory logic and expand auth, role-based access, logging, tests, and CI/CD before production.
- Ensure SendGrid domain authentication and proper SPF/DKIM setup for deliverability.


## Added features (auth, frontend polish, CI/CD, GDELT)

### Authentication & Subscriptions
- JWT auth endpoints: `/api/auth/register`, `/api/auth/login`.
- Protected routes require `Authorization: Bearer <token>` header.
- Subscriptions are linked to user accounts (email). Checkout sessions require auth in frontend flow.
- Webhook creates/updates user and subscription records in Postgres.

### Frontend
- Full React app with routing, Tailwind CSS, auth pages, dashboard with charts (Recharts).
- Frontend calls backend endpoints and uses JWT stored in localStorage.

### CI/CD & VPS deployment (GoDaddy VPS)
- GitHub Actions workflow that zips the repo and rsyncs to your VPS (configure secrets VPS_SSH_KEY, VPS_USER, VPS_HOST, VPS_PATH).
- `scripts/deploy.sh` runs on the VPS to install deps, run migrations, build frontend, and create a systemd service.
- `server/nginx_ikuruka.conf` is a nginx template for reverse proxy. Use Certbot to obtain SSL:
  - `sudo apt update && sudo apt install certbot python3-certbot-nginx`
  - `sudo certbot --nginx -d your-domain.com -d www.your-domain.com`
  - Certbot will update nginx config to use TLS and reload the server.

### GDELT (BigQuery)
- `server/gdelt_bigquery.js` shows how to query BigQuery using `@google-cloud/bigquery`.
- Put Google service account JSON on the server and set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`.
- Sample queries provided in `server/gdelt_queries.sql` (top themes, locations, time series).

