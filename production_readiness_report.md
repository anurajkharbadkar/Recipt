# Production Readiness Review — Digital Pavti Book (डिजिटल पावती बुक)

This document provides a comprehensive audit of the project's readiness for live production deployment on **Vercel** and **Railway**.

---

## 🚦 Summary Status

| Category | Status | Action Taken / Recommendation |
| :--- | :---: | :--- |
| **Monorepo Build Engine** | 🟢 **Ready** | Added `railway.json` to configure Turborepo build/start lifecycle. |
| **Workspace Dependency Resolution** | 🟢 **Ready** | Fixed `tsc: not found` by declaring `typescript` in `@pavti/shared`. |
| **PDF Generation (Puppeteer)** | 🟢 **Ready** | Allowed configuring custom native Chromium binaries in `PdfService`. |
| **Offline PWA & Image CDNs** | 🟢 **Ready** | Activated `next-pwa` and added production wildcard remote image patterns. |
| **File Storage Persistency** | ⚠️ **Warning** | Local file storage is **ephemeral**. Cloudflare R2/S3 config is required. |
| **API Rate Limiting & Security** | 💡 **Info** | Throttler is configured but needs a global Guard binding. |

---

## 🛠️ Key Improvements Made

### 1. Fixed Monorepo Shared Compilation (`@pavti/shared`)
*   **Issue**: On clean cloud builders, building the monorepo recursively resulted in `sh: 1: tsc: not found` inside `@pavti/shared`.
*   **Fix**: Added `typescript` to `packages/shared/package.json` devDependencies and regenerated `pnpm-lock.yaml`.

### 2. Tailored Railway Build Lifecycle (`railway.json`)
*   **Issue**: Railway's Nixpacks fell back to checking the root directory, which lacks a direct server-start script.
*   **Fix**: Created a `railway.json` configuration file at the repository root to explicitly run:
    *   **Build**: `pnpm build` (compiles shared modules, web, and NestJS API in topological order).
    *   **Start**: `pnpm --filter @pavti/api start` (runs the NestJS server).

### 3. Enabled Custom Chromium Binary Executable Paths
*   **Issue**: Puppeteer crashed on server runtimes if the standard Chromium download didn't match the OS architecture or lacked system libraries.
*   **Fix**: Modified `PdfService` to load `PUPPETEER_EXECUTABLE_PATH` from `ConfigService`. In production on Railway, you can now set this environment variable to a pre-installed stable browser path (e.g. `/usr/bin/chromium-browser`) to avoid library compatibility crashes.

### 4. Activated PWA & Remote Image Optimization
*   **Issue**: `next-pwa` was declared in dependencies but never wrapper-initialized in `next.config.js`. Additionally, remote image assets (such as logos hosted on R2) would trigger Next.js image loading errors.
*   **Fix**: Configured `next-pwa` inside `apps/web/next.config.js` and added a wildcard HTTPS protocol to `remotePatterns` to support any secure CDN storage path in production.

---

## ⚠️ Critical Actions Required Before Going Live

### 1. Setup S3 or Cloudflare R2 Storage (Mandatory)
On container platforms like Railway, the local disk is **ephemeral** (files are deleted on every build, crash, or daily maintenance restart).
*   **Action**: Ensure `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_URL` are configured on Railway. This ensures donor receipts, PDFs, and organization logos are stored permanently.

### 2. Bind the ThrottlerGuard Globally (Recommended Security Enhancement)
While `ThrottlerModule` is configured in `app.module.ts` to prevent brute-force attacks (e.g., OTP requests or logins), the guard is not active globally.
*   **Recommendation**: Add the `APP_GUARD` provider to `AppModule` to activate rate-limiting globally.
    ```typescript
    // In apps/api/src/app.module.ts
    import { APP_GUARD } from '@nestjs/core';
    import { ThrottlerGuard } from '@nestjs/throttler';

    @Module({
      // ...
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        }
      ]
    })
    ```

### 3. Confirm CORS and App URLs
*   **Railway API**: Verify `FRONTEND_URL` and `CORS_ORIGIN` variables match your Vercel URL (e.g., `https://digital-pavti-book.vercel.app`).
*   **Vercel Client**: Verify `NEXT_PUBLIC_API_URL` is set to the Railway URL with `/api/v1` (e.g., `https://api-production.up.railway.app/api/v1`).
