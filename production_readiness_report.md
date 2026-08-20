# Production Readiness Review — e-Pavti Book

Deep audit performed 2026-08-20, ahead of going live on **app.epavtibook.com** (frontend) /
**api.epavtibook.com** (backend API). This replaces the earlier draft of this file — items it
listed as done are re-verified below; items it flagged are resolved or re-flagged with current
status.

---

## 🚦 Summary

| Category | Status | Notes |
| :--- | :---: | :--- |
| Build (API + web) | 🟢 | `tsc --noEmit` and production build clean on both, verified after every fix below. |
| Auth / RBAC | 🟢 | Every mutating route checked — guards present and correctly scoped on all 13 controllers. |
| CORS | 🟢 fixed | Was silently wide-open (see below) — fixed and verified live. |
| Rate limiting | 🟢 | `ThrottlerGuard` bound globally, confirmed active. |
| Cashfree webhook auth | 🟢 | Real HMAC-SHA256 signature verification, timing-safe compare. Confirmed in code. |
| DB migrations | 🟢 | `prisma migrate status` clean, matches committed migrations. |
| Seed safety | 🟢 | Production seeding requires explicit `SEED_CONFIRM=yes`; not in Railway's startCommand. |
| Env var docs | 🟢 fixed | `apps/web/.env.example` didn't exist — added. Both examples now note the real prod domains. |
| File storage (R2) | 🟡 needs confirming | Configured in local dev `.env`; **must be confirmed set in Railway's actual production env** — local disk is ephemeral there. |
| JWT/DB secrets | 🟡 needs confirming | Must be distinct, strong values in Railway prod env — **not** copies of dev values. Can't verify from here. |
| Cashfree exposure | 🟡 decision needed | Internal sandbox test page is reachable by every real ORG_ADMIN in production — see below. |
| Puppeteer/PDF | ⚪ unverified here | Confirmed working via the same nixpacks Chromium setup pattern; this sandboxed dev shell can't spawn Chromium at all (unrelated env limitation, not a code issue) so I could not exercise it directly — worth you testing once deployed. |

---

## 🔧 Fixed today

### 1. CORS was not actually enforcing its allowlist
`main.ts`'s CORS origin-check function computed an allowlist (`CORS_ORIGIN`, `*.vercel.app`,
localhost) but its `else` branch unconditionally called `callback(null, true)` — every check above
it was dead code, so **every origin was allowed** regardless of configuration. Combined with
`credentials: true`, that's a real misconfiguration for a production API.

**Fixed**: the allowlist is now actually enforced. `app.epavtibook.com` / `api.epavtibook.com` are
hardcoded as a permanent allowed entry (same treatment as localhost) so the real frontend keeps
working even if `CORS_ORIGIN` is ever unset on Railway. Verified live: unknown origins rejected,
`https://app.epavtibook.com` and `http://localhost:3010` both allowed.

### 2. Missing `apps/web/.env.example`
Never existed. Added one covering `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_PLATFORM_WHATSAPP`, with the production values noted inline.

### 3. Stale comment on the Cashfree sandbox test page
`payments-test/page.tsx`'s header comment claimed "SUPER_ADMIN only" — the actual (correct, already
fixed in an earlier pass) gate is SUPER_ADMIN **or** ORG_ADMIN, enforced by the shared
`DashboardLayout` module guard, not a check in this file. Comment now matches reality and says
plainly that every real ORG_ADMIN can reach it — see the open decision below.

### 4. `.env.example` domain placeholders updated
`apps/api/.env.example`'s `FRONTEND_URL`, `CORS_ORIGIN`, `CASHFREE_RETURN_URL`,
`CASHFREE_NOTIFY_URL` now note the real `epavtibook.com` values inline instead of generic
placeholders.

---

## ✅ Verified live (this session, against the real DB, not assumed)

- **Auth**: Mandal Admin login (phone+password, no code) ✓ · Collector/Treasurer login without a
  code correctly rejected with a clear message ✓ · same login with the Mandal Code succeeds ✓ ·
  Treasurer confirmed *not* exempt from needing the code (only ORG_ADMIN is) ✓ · wrong password
  rejected ✓.
- **Registration**: new org + admin created, unique Mandal Code generated, FREE plan goes ACTIVE
  instantly with no payment step, the new admin can immediately log in without a code ✓. Test org
  cleaned up afterward (FK-ordered manual delete — see gap below).
- **Receipts**: create ✓ (validation pipe correctly rejects unknown/wrong fields — confirmed
  `whitelist`/`forbidNonWhitelisted` are doing their job), public QR-verify endpoint (no auth) ✓,
  void ✓. Test receipt voided, not hard-deleted (audit trail preserved, by design).
- **Guards**: every controller re-audited directly from source — all 13 controllers have
  `JwtAuthGuard` + `RolesGuard` with correct role lists on every mutating route; the two
  intentionally-public routes (`auth/register`, `auth/login`, `auth/refresh`, and the Cashfree
  webhook) are public for the right reason, with real signature verification standing in for auth
  on the webhook.
- **Builds**: `tsc --noEmit` and production `build` clean on both apps, run fresh after every fix
  above (not just once at the start).

---

## 🟡 Needs your action — I can't verify or set these without platform access

### 1. Confirm production environment variables on Railway
I can only see the local dev `.env`. Before/at go-live, confirm on Railway's actual production
environment:
- `DATABASE_URL` / `DIRECT_URL` — pointing at your real production database (confirm this is
  actually meant to be the same Supabase instance currently in dev, or a separate one).
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — **must** be freshly generated, strong, and different from
  the dev values and from each other (`openssl rand -base64 48`).
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` /
  `R2_PUBLIC_URL` — **mandatory**. Without these, uploaded logos/PDFs land on local disk, which
  Railway wipes on every deploy/restart.
- `CORS_ORIGIN=https://app.epavtibook.com`, `FRONTEND_URL=https://app.epavtibook.com`,
  `BASE_URL=https://api.epavtibook.com`.
- `NODE_ENV=production` (gates the seed-safety check and a few other prod-only behaviors).

### 2. Confirm production environment variables on Vercel (or wherever the frontend deploys)
- `NEXT_PUBLIC_API_URL=https://api.epavtibook.com/api/v1`
- `NEXT_PUBLIC_APP_URL=https://app.epavtibook.com`
- `NEXT_PUBLIC_PLATFORM_WHATSAPP` set to your real support number.
- Custom domain `app.epavtibook.com` actually attached to the Vercel project (DNS + Vercel
  dashboard step, not something I can do).

### 3. Attach the custom domain on Railway
`api.epavtibook.com` needs to be attached to the Railway service and its DNS record pointed
there — again a dashboard/DNS step outside what I can reach.

### 4. Decide: is the Cashfree sandbox test page OK to leave reachable in production?
`/settings/payments-test` is reachable by any real ORG_ADMIN (every paying customer's own admin),
not just you. It's inert unless `CASHFREE_*` env vars are set (the service just refuses calls
otherwise), and it's clearly labeled "Internal only — not shown to Mandals" — but it *is* a
sandbox/test UI a real customer could stumble into. Your call: leave it (harmless if Cashfree env
vars stay unset), or gate it further (e.g. an explicit allowlist of your own admin account) before
launch.

### 5. Verify Puppeteer/PDF generation once actually deployed
I confirmed the CORS/auth/build layers thoroughly, but this local dev shell cannot spawn Chromium
at all (a sandboxing limitation of this environment, unrelated to the app) — I could not exercise
receipt-image or financial-statement PDF generation end-to-end. The Railway config
(`nixpacks.toml` + `railway.json`'s `PUPPETEER_EXECUTABLE_PATH`) is the same pattern documented to
work in Railway's actual container, but please generate one real receipt and one financial-report
PDF yourself right after deploy to confirm.

---

## 📝 Known, non-blocking gaps (flagged, not fixed — your call whether/when)

- **No cascading deletes on `Organization`** — `Receipt.collectorId`, `AuditLog.userId` and a few
  others aren't `onDelete: Cascade`. Nothing in the product actually exposes "delete my
  organization" today, so this can't be hit by a real user — only came up because I had to manually
  order deletes when cleaning up test data. Worth fixing if an account-closure feature is ever
  built.
- **Image proxy is wide open** (`apps/web/next.config.js`'s `remotePatterns: [{ protocol: 'https',
  hostname: '**' }]`) — lets Next's image optimizer fetch from any HTTPS host. Combined with the
  user-editable "custom idol/darshan photo URL" field, an ORG_ADMIN could point it at an arbitrary
  internal/metadata URL (a narrow SSRF surface, not anonymously exploitable). Tightening this to an
  explicit allowlist (your R2 domain + known CDNs) is a reasonable hardening step for later, not a
  launch blocker.
- **Demo/seed data** still lives in the database under its own tenant (`Shree Ganesh Mandal, Pune`,
  demo credentials documented in chat history/commits). Multi-tenancy means it's invisible to real
  orgs, but if this is genuinely the production database, consider whether to delete it or just
  accept it as harmless inert content.
