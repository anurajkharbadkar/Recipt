# Production Deployment Guide — Digital Pavti Book (डिजिटल पावती बुक)

This guide provides step-by-step instructions to deploy the **Digital Pavti Book** platform to production, making it accessible on the internet for community members and organization administrators.

---

## 🏗️ Architecture Overview

The system is structured as a Turborepo monorepo. It comprises:
1. **Frontend App (`@pavti/web`)**: Next.js 14 Single-Page/Progressive Web App (PWA).
2. **Backend API (`@pavti/api`)**: NestJS REST API using Prisma ORM.
3. **Shared Library (`@pavti/shared`)**: Shared types, schemas, and validators.

Here is how the production components interact:

```mermaid
graph TD
    Client["Next.js Web App (Vercel)"]
    API["NestJS API (Railway)"]
    DB[("PostgreSQL (Railway/Neon)")]
    R2[("Cloudflare R2 (S3 Storage)")]
    Razorpay["Razorpay API"]
    WhatsApp["WhatsApp Cloud API"]
    MSG91["MSG91 API (SMS)"]

    Client -- "HTTPS requests & JSON" --> API
    Client -- "Direct UPI checkout" --> Razorpay
    API -- "Queries via Prisma" --> DB
    API -- "Upload files / PDFs" --> R2
    API -- "Deliver digital receipts" --> WhatsApp
    API -- "Deliver verification OTPs" --> MSG91
```

---

## 🗄️ Phase 1: Deploying the Database (PostgreSQL)

You need a managed PostgreSQL 16+ instance. You can deploy this on **Railway** (recommended for simplicity) or **Neon/Supabase** (for a dedicated serverless DB).

### Option A: Railway PostgreSQL (Recommended)
1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** → **Provision PostgreSQL**.
3. Once provisioned, click on the PostgreSQL service.
4. Go to **Variables** and copy the `DATABASE_URL` (use the `Connection URL` or `EXTERNAL_URL` if connecting from outside Railway).

### Option B: Neon Database
1. Go to [Neon.tech](https://neon.tech/) and create a free project.
2. Select PostgreSQL 16+ and choose a region closest to your users (e.g., `ap-south-1` for India).
3. Copy the connection string under **Connection Details**.

---

## 🔌 Phase 2: Deploying the NestJS Backend (`@pavti/api`) on Railway

The backend needs to run on a platform that supports continuous Node.js runtime execution. Railway is ideal because it supports monorepos natively.

### Step 1: Create a Railway Project
1. In your Railway dashboard, click **New Project** → **Deploy from GitHub repo**.
2. Select your repository.
3. Railway will ask for settings. Configure the service variables and build options first:

### Step 2: Configure Service Settings
*   **Root Directory**: `/` (Keep this as the root, as it is a monorepo).
*   **Build Command**: `pnpm build` (This runs Turborepo, compiling the shared package and NestJS API).
*   **Start Command**: `pnpm --filter @pavti/api start` (Runs the compiled NestJS main server).
*   **Publish Directory / Output Path**: (Railway will automatically detect the entry point based on the start command).

### Step 3: Set Environment Variables
Add the following variables in the **Variables** tab of the API service:

| Variable Name | Value Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Set to `production` | `production` |
| `PORT` | The port Railway provides | `${{PORT}}` (defaulted by Railway) |
| `DATABASE_URL` | The PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `BASE_URL` | The public domain of your deployed Railway API | `https://api-production.up.railway.app` |
| `FRONTEND_URL` | The Vercel URL of your frontend | `https://digital-pavti-book.vercel.app` |
| `CORS_ORIGIN` | Allowed domains (comma-separated if multiple) | `https://digital-pavti-book.vercel.app` |
| `JWT_SECRET` | A secure, random 32+ character string | `super-secret-jwt-key` |
| `JWT_REFRESH_SECRET` | A separate secure, random string | `super-secret-refresh-key` |
| `JWT_EXPIRES_IN` | Short expiration for session tokens | `15m` |
| `JWT_REFRESH_EXPIRES_IN`| Long expiration for refresh tokens | `7d` |

### Step 4: Add Prisma Migration Phase
To ensure database migrations apply automatically on deployment:
1. In Railway, go to your API Service **Settings**.
2. Find the **Custom Build Command** or **Pre-deploy Command** and set it to:
   ```bash
   pnpm --filter @pavti/api db:migrate && pnpm build
   ```
   *This ensures migrations run before the server boots.*

---

## 💻 Phase 3: Deploying the Next.js Frontend (`@pavti/web`) on Vercel

Vercel is the native platform for Next.js and has built-in optimizations for Turborepo monorepos.

### Step 1: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New** → **Project**.
2. Select your GitHub repository.
3. Under **Project Settings**, configure:
   *   **Framework Preset**: `Next.js`
   *   **Root Directory**: `apps/web` (Click "Edit" and select the `apps/web` directory)
   *   **Build & Development Settings**: Keep defaults (Vercel automatically detects the Turborepo root and runs `pnpm build`).

### Step 2: Set Environment Variables
Add the following variables in Vercel:

| Variable Name | Value Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | URL of the Railway API (with `/api/v1` suffix) | `https://api-production.up.railway.app/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Your frontend production URL | `https://digital-pavti-book.vercel.app` |

### Step 3: Deploy
Click **Deploy**. Vercel will install dependencies using your root `pnpm-lock.yaml`, build the shared library `@pavti/shared`, compile the Next.js app, and deploy it.

---

## ⚙️ Phase 4: Setting Up Third-Party Production Integrations

To enable receipts, messaging, files, and payments, configure these keys in your NestJS API (`apps/api/.env`) variables on Railway.

### 1. Cloudflare R2 (S3-Compatible PDF/Image Storage)
Local uploads won't persist across Railway server restarts. You must use Cloudflare R2 or AWS S3.
1. Sign up/log in to [Cloudflare](https://dash.cloudflare.com/).
2. Create an **R2 Bucket** (e.g., `pavti-production-files`).
3. Set bucket access to **Public** to make uploaded files downloadable (or set up a custom domain).
4. Generate API tokens with **Edit** access and copy the credentials:
   ```env
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_access_key_id
   R2_SECRET_ACCESS_KEY=your_secret_access_key
   R2_BUCKET_NAME=pavti-production-files
   R2_PUBLIC_URL=https://pub-yourbucketid.r2.dev
   ```

### 2. WhatsApp Business Cloud API (Receipt Delivery)
1. Go to the [Meta Developers Portal](https://developers.facebook.com/).
2. Create a business app and add the **WhatsApp** product.
3. Link your phone number and configure templates for your receipt (with variables for Name, Amount, Receipt #, and PDF URL link).
4. Grab the tokens:
   ```env
   WHATSAPP_ACCESS_TOKEN=your_permanent_system_user_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   ```

### 3. Razorpay (UPI & Online Collections)
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/) and switch to **Live Mode**.
2. Go to **Settings** → **API Keys** and click **Generate Live Key**.
3. Save the values:
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Set up a Webhook pointing to `https://api-production.up.railway.app/api/v1/payments/webhook` with the webhook secret.

### 4. MSG91 (Verification SMS/OTPs)
1. Log in to [MSG91](https://msg91.com/).
2. Set up a DLT registration in India for OTP SMS templates.
3. Configure the env variables:
   ```env
   MSG91_API_KEY=your_msg91_auth_key
   MSG91_SENDER_ID=your_dlt_approved_sender_id
   MSG91_OTP_TEMPLATE_ID=your_approved_otp_template_id
   ```

---

## 🛠️ Post-Deployment Checklist

> [!IMPORTANT]
> Make sure to execute these steps to ensure everything runs smoothly:

- [ ] **Run Initial Database Seed**:
  If you need base roles and collections to start, run the seed script once. In Railway, you can connect via the terminal or trigger a task to run:
  ```bash
  pnpm --filter @pavti/api db:seed
  ```
- [ ] **Test HTTPS/SSL**:
  Verify both frontend (Vercel) and backend (Railway) links show the green padlock.
- [ ] **Inspect CORS Headers**:
  Open the developer console on your frontend and verify requests succeed without CORS warnings.
- [ ] **Install as PWA**:
  Open the Vercel site on your Android/iOS Chrome browser, verify the install option is active, and test offline page loads.
