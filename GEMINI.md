# GEMINI.md - MyBillBook SaaS Billing Platform

## Project Overview
MyBillBook is a comprehensive full-stack SaaS billing and inventory management platform designed for small to medium-sized businesses. It features a multi-tenant architecture where each user belongs to a company and can manage customers, suppliers, products, invoices, and expenses.

### Architecture
- **Backend:** Node.js & Express REST API.
- **Frontend:** React (SPA) with Tailwind CSS and Radix UI.
- **Database:** PostgreSQL managed via Sequelize ORM.
- **Auth:** JWT-based authentication with role-based access control (Owner, Admin, Staff).
- **Multi-tenancy:** Data isolation is enforced via `company_id` across most models.

---

## Deployment Guide

### Railway (Backend & PostgreSQL)
You have two options on Railway:
1. **Separate Services (Recommended for performance):** Create two separate backend services on Railway, one pointing to `/backend` and another to `/admin/backend`. Set `DATABASE_URL` for each accordingly.
2. **Monorepo Gateway (Recommended for 1-backend slot):** Point Railway to the root directory. It will use the root `package.json` to start `railway-monorepo.js`, which launches both backends and proxies them:
   - Main API: `YOUR_RAILWAY_URL/api`
   - Admin API: `YOUR_RAILWAY_URL/admin/api`

**Required Environment Variables (Railway):**
- `DATABASE_URL`: Your main PostgreSQL connection string.
- `DATABASE_URL_SaaS`: (Same as above for Admin Backend).
- `DATABASE_URL_ADMIN`: Your admin PostgreSQL connection string.
- `JWT_SECRET`: Random long string.
- `ADMIN_SECRET`: Secret for admin authentication.

### Vercel (Frontend & Admin Frontend)
Deploy as two separate projects on Vercel:
1. **Main Frontend:** Point to `/frontend`.
   - Set `VITE_BACKEND_URL` to your Railway URL.
2. **Admin Frontend:** Point to `/admin/frontend`.
   - Set `VITE_ADMIN_BACKEND_URL` to your Railway URL (e.g., `https://.../admin` if using monorepo).

---

## Technical Stack

### Backend (`/backend`)
- **Core:** Express 5.x
- **ORM:** Sequelize (PostgreSQL)
- **Security:** Helmet, CORS, Express Rate Limit, BcryptJS
- **Validation:** Express Validator
- **File Handling:** Multer (for logos and signatures)
- **PDF Generation:** PDFKit
- **Logging:** Morgan

### Frontend (`/frontend`)
- **Core:** React 19 (CRA/Craco)
- **Styling:** Tailwind CSS, Radix UI (shadcn/ui components)
- **Routing:** React Router 7
- **Form Handling:** React Hook Form + Zod (Validation)
- **API Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React

---

## Directory Structure

### Backend
- `controllers/`: Request handling logic.
- `models/`: Sequelize model definitions and associations.
- `routes/`: API endpoint definitions.
- `services/`: Business logic (PDF generation, invoice numbering, etc.).
- `middleware/`: Auth, validation, and company context injection.
- `utils/`: Helper functions (OTP generation, etc.).

### Frontend
- `src/components/`: Reusable UI components (including Radix/shadcn UI).
- `src/pages/`: Main application views (Dashboard, Invoices, etc.).
- `src/services/api.js`: Axios instance and API call definitions.
- `src/context/`: React Context providers (Auth).
- `src/hooks/`: Custom React hooks.

---

## Production Readiness Checklist (Completed April 2026)

- [x] **Persistent Asset Storage:** Refactored `uploadService.js` to use Cloudinary. This prevents data loss on Render's ephemeral filesystem.
- [x] **Dynamic CORS Configuration:** Externalized allowed origins to `ALLOWED_ORIGINS` environment variable in both main and admin backends.
- [x] **Unified Frontend API:** Consolidated Axios instances and implemented `VITE_BACKEND_URL` environment variables in the frontend.
- [x] **Production Dependency Management:** Added `cloudinary` and `multer-storage-cloudinary` to backend packages.
- [x] **Admin-SaaS Connection:** Unified database connections and shared models between `/backend` and `/admin/backend` to ensure data consistency and reduce redundancy.
- [x] **Platform Admin Access:** Implemented a secure "Platform Admin" portal link in the main SaaS dashboard for authorized developers (pachu.mgd@gmail.com).

## Subscription Plan Enforcement

The platform enforces plan limits and features via the `SubscriptionGuard` and `checkSubscriptionQuota` middleware.

### Current Plan Details (April 2026 Update)

| Feature | Free Account | Premium | Enterprise |
| :--- | :--- | :--- | :--- |
| **Price** | Free | ₹499/3 Months | ₹699/3 Months |
| **Manage Businesses** | 1 | 2 | 3 |
| **User Access** | 1 | 5 | 20 |
| **Invoices / Month** | 50 | 999,999 | 999,999 |
| **E-way Bills** | Upgrade | 5 / Month | Unlimited |
| **Staff & Payroll** | Upgrade | Included | Included |
| **Multiple Godowns** | Upgrade | Included | Included |
| **Multi-Business UI** | Upgrade | Upgrade | Included |
| **Activity Tracker** | Upgrade | Upgrade | Included |
| **Priority Support** | Upgrade | Upgrade | Included |

*Note: "Multi-Business UI" refers to the ability to manage more than 2 businesses simultaneously as a designated feature.*

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example` (ensure `DB_URL` and `JWT_SECRET` are set).
4. Run development server: `npm run dev`
   - The server runs on port `8001` by default.
   - Database synchronization and plan seeding happen automatically on startup.

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Create `.env` and set `REACT_APP_BACKEND_URL=http://localhost:8001`.
4. Run development server: `npm start`
   - The frontend runs on port `3000` by default.

### Commands
- **Backend:**
  - `npm start`: Runs the production server.
  - `npm run dev`: Runs the server (alias for start).
- **Frontend:**
  - `npm start`: Runs the React app in development mode.
  - `npm run build`: Builds the app for production.
  - `npm test`: Runs test suite.

---

## Development Conventions

### Backend
- **Company Context:** Always use the `companyContext` middleware for routes that require company isolation. It attaches `req.company_id` to the request.
- **Validation:** Use `express-validator` schemas in the `middleware/validation.js` for all POST/PUT requests.
- **Response Format:** Follow the standard `{ data: ... }` or `{ error: "message" }` format.

### Frontend
- **UI Components:** Use existing Radix UI components in `src/components/ui/`.
- **API Calls:** Always use the exported functions from `src/services/api.js`.
- **Forms:** Use `react-hook-form` paired with `zod` schemas for consistency and type safety.
- **Styling:** Use Tailwind utility classes; avoid writing custom CSS in `App.css` unless necessary.

---

## Key Features & Endpoints
- **Auth:** `/api/auth` (Login, Register, OTP)
- **Invoicing:** `/api/invoices` (GST calculation, PDF generation)
- **Inventory:** `/api/products` (Stock adjustment, Low stock alerts)
- **Subscriptions:** `/api/subscription` (Free, Basic, Premium, Enterprise plans)
- **Reporting:** `/api/reports` (Profit & Loss, Sales, GST, Stock)
