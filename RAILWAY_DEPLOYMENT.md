# Bill Easy - Railway Deployment Guide

## Overview

This project uses a **monorepo architecture** where both frontend and backends are deployed as a **single service** on Railway. This approach simplifies deployment and works perfectly with custom domains.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Service                      │
│                      (Single Port)                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Frontend  │  │Main Backend │  │  Admin Backend  │ │
│  │  (Static)   │  │  (Port 8001)│  │  (Port 3025)    │ │
│  │   /, /login │  │   /api/*    │  │  /admin/api/*   │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│         │                │                  │           │
│         └────────────────┴──────────────────┘           │
│                    Monorepo Gateway                     │
│                    (railway-monorepo.js)                │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
/
├── railway-monorepo.js    # Gateway that serves frontend & proxies APIs
├── nixpacks.toml          # Build configuration
├── railway.toml           # Railway deployment settings
├── .railwayignore         # Files to exclude from deployment
├── frontend/              # React + Vite frontend
│   ├── dist/             # Built frontend (generated)
│   └── src/
├── backend/               # Main API backend
│   └── server.js
└── admin/
    └── backend/           # Admin control panel backend
        └── server.js
```

## Deployment Steps

### 1. Push to Git

```bash
git add .
git commit -m "Setup Railway monorepo deployment with custom domain support"
git push origin main
```

### 2. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 3. Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically set `DATABASE_URL`

### 4. Configure Environment Variables

Add these variables in Railway Dashboard → Variables:

```env
# Required
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this

# Database (auto-set by Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Razorpay (Payment)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AI
GEMINI_API_KEY=your_gemini_api_key

# Custom Domain Support (set after domain setup)
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
```

### 5. Deploy

Railway will automatically:
1. Build frontend: `cd frontend && npm run build`
2. Install backend dependencies
3. Start the monorepo gateway

### 6. Add Custom Domain (Optional)

1. In Railway Dashboard, go to your service
2. Click "Settings" → "Domains"
3. Click "Generate Domain" (for Railway subdomain) or "Custom Domain"
4. If using custom domain, add the DNS records as shown
5. Wait for SSL certificate to be issued
6. Update `FRONTEND_URL` environment variable with your domain

## URL Structure After Deployment

| Path | Destination | Description |
|------|-------------|-------------|
| `/` | Frontend | Main application |
| `/login` | Frontend | Login page |
| `/dashboard` | Frontend | Dashboard (protected) |
| `/api/*` | Main Backend | API endpoints |
| `/admin/api/*` | Admin Backend | Admin API endpoints |
| `/uploads/*` | Static files | Uploaded files |
| `/health` | Gateway | Health check |

## Testing After Deployment

### 1. Health Check
```bash
curl https://yourdomain.com/health
```
Should return: `{"status":"ok","service":"monorepo-gateway"}`

### 2. API Check
```bash
curl https://yourdomain.com/api/health
```
Should return: `{"status":"ok","name":"Bill Easy API"}`

### 3. Frontend Check
Open `https://yourdomain.com` in browser - should load the app.

## Troubleshooting

### CORS Errors
If you see CORS errors in browser console:
1. Check `FRONTEND_URL` env var includes your domain
2. Restart the service after changing env vars

### Build Failures
Check Railway build logs:
1. Ensure `frontend/dist` is being generated
2. Check for npm install errors

### Database Connection Issues
1. Verify `DATABASE_URL` is set
2. Check if database is in same Railway project
3. For external DB, ensure network access is allowed

### 404 on Page Refresh
This is handled by `railway-monorepo.js` - all non-API routes serve `index.html`.

## Answering Your Question

> "If we combine both backend and frontend and host in Railway as single service and connect external domain, will it work?"

**YES, absolutely!** This is exactly what this setup does:

✅ **Advantages of Single-Service Deployment:**
- **One URL** for everything - no CORS issues
- **One deployment** - simpler CI/CD
- **Custom domain works perfectly** - just point domain to Railway
- **Free SSL** - Railway provides SSL for custom domains
- **Same origin** - frontend and backend share domain, improving security

✅ **How it works:**
1. User visits `https://yourdomain.com`
2. Railway routes to the monorepo gateway
3. Gateway serves static frontend files for `/`, `/login`, etc.
4. Gateway proxies `/api/*` requests to backend
5. Everything appears to come from same origin

✅ **Custom Domain Setup:**
1. Add domain in Railway dashboard
2. Set `FRONTEND_URL=https://yourdomain.com`
3. Done! Both frontend and API work on same domain

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `NODE_ENV` | Yes | Set to `production` |
| `FRONTEND_URL` | No | Your custom domain(s) |
| `RAZORPAY_KEY_ID` | No | For payments |
| `RAZORPAY_KEY_SECRET` | No | For payments |
| `SMTP_HOST` | No | Email server |
| `GEMINI_API_KEY` | No | AI features |
| `RAILWAY_PUBLIC_DOMAIN` | Auto | Set by Railway |

## Support

For issues specific to this deployment setup, check:
1. Railway logs in dashboard
2. `/health` endpoint for gateway status
3. `/api/health` for backend status
