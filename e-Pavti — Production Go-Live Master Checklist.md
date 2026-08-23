# e-Pavti — Production Go-Live Master Checklist

**Goal:** Launch e-Pavti as a secure, scalable, reliable, fast and search-engine-ready SaaS product for real Mandals and organizations.

**Launch principle:**

> Do not launch because the application "works."\
> Launch when the application has been **tested, secured, monitored, backed up and recoverable**.

---

# PHASE 0 — Product Scope & Architecture

## Product readiness

- [ ] Finalize MVP feature list
- [ ] Verify every advertised feature actually works
- [ ] Verify every pricing-plan limitation is enforced technically
- [ ] Verify FREE / BASIC / STANDARD / PREMIUM entitlements
- [ ] Verify season-based subscription logic
- [ ] Verify campaign limits
- [ ] Verify collector/staff limits
- [ ] Verify receipt limits
- [ ] Verify all premium features are protected
- [ ] Verify no unfinished feature is exposed publicly
- [ ] Remove placeholder/demo content from production
- [ ] Remove developer/test accounts
- [ ] Remove test payment data
- [ ] Remove test Mandals and donors

## Architecture

- [ ] Production architecture documented
- [ ] Frontend architecture documented
- [ ] Backend architecture documented
- [ ] Database architecture documented
- [ ] Multi-tenant architecture documented
- [ ] Payment architecture documented
- [ ] Background jobs/queue architecture documented
- [ ] External integrations documented
- [ ] Failure/recovery strategy documented

---

# PHASE 1 — Domain & Production Infrastructure

## Domain

- [ ] Primary domain purchased
- [ ] Domain verified in Vercel
- [ ] HTTPS active
- [ ] SSL certificate valid
- [ ] Domain renewal enabled
- [ ] Domain ownership/recovery email secured
- [ ] Registrar account protected with 2FA

## Recommended domain structure

- [ ] `yourdomain.com` → marketing website
- [ ] `app.yourdomain.com` → application
- [ ] `api.yourdomain.com` → backend API
- [ ] `support.yourdomain.com` → support/help centre
- [ ] `www.yourdomain.com` → canonical redirect

## DNS

- [ ] DNS records documented
- [ ] No unnecessary DNS records
- [ ] SPF configured
- [ ] DKIM configured
- [ ] DMARC configured
- [ ] DNS changes tested
- [ ] Old/staging domains checked

Your existing production plan already uses the same general separation of app and API domains.

---

# PHASE 2 — Frontend Production

## Vercel

- [ ] Production project configured
- [ ] Production branch identified
- [ ] Preview deployments working
- [ ] Production deployment working
- [ ] Custom domain connected
- [ ] Correct framework/build configuration
- [ ] Correct Node.js version
- [ ] Production environment variables configured
- [ ] Sensitive variables protected
- [ ] No secrets exposed through `NEXT_PUBLIC_*`

Vercel explicitly warns that `NEXT_PUBLIC_*` variables are embedded into the client bundle and therefore must never contain secrets.

## Frontend

- [ ] No console errors
- [ ] No hydration errors
- [ ] No broken links
- [ ] No missing images
- [ ] No placeholder text
- [ ] No lorem ipsum
- [ ] No development URLs
- [ ] No localhost URLs
- [ ] No test API endpoints
- [ ] Proper loading states
- [ ] Proper empty states
- [ ] Proper error states
- [ ] Proper 404 page
- [ ] Proper unauthorized page
- [ ] Proper forbidden page
- [ ] Proper offline state where applicable

---

# PHASE 3 — Backend/API

## API

- [ ] Production API deployed
- [ ] `api.yourdomain.com` configured
- [ ] HTTPS enabled
- [ ] `/health` endpoint implemented
- [ ] Health endpoint tested
- [ ] API versioning implemented
- [ ] CORS configured correctly
- [ ] Production origins explicitly whitelisted
- [ ] Debug mode disabled
- [ ] Swagger/API documentation reviewed
- [ ] Internal/admin endpoints protected

## API security

- [ ] Authentication required where appropriate
- [ ] Authorization enforced server-side
- [ ] Rate limiting enabled
- [ ] Request validation enabled
- [ ] Input sanitization implemented
- [ ] Payload size limits configured
- [ ] File upload limits configured
- [ ] Error responses don't expose stack traces
- [ ] Internal database errors hidden from clients

---

# PHASE 4 — Database

## PostgreSQL

- [ ] Production database created separately from development
- [ ] Production database credentials generated securely
- [ ] SSL enabled
- [ ] Connection limits configured
- [ ] Indexes reviewed
- [ ] Slow queries identified
- [ ] Foreign keys verified
- [ ] Unique constraints verified
- [ ] Transaction boundaries reviewed
- [ ] Database migrations tested
- [ ] Rollback strategy documented

## Multi-tenancy

Every organization-owned record must be correctly isolated.

Test:

- [ ] Mandal A cannot access Mandal B receipts
- [ ] Mandal A cannot access Mandal B donors
- [ ] Mandal A cannot access Mandal B expenses
- [ ] Mandal A cannot access Mandal B reports
- [ ] Mandal A cannot access Mandal B users
- [ ] Mandal A cannot access Mandal B files
- [ ] API cannot bypass organization filtering
- [ ] Direct object IDs cannot expose another organization's data

This is particularly important because e-Pavti is a multi-tenant SaaS.

---

# PHASE 5 — Authentication & Access Management

## Authentication

- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] OTP/password flow tested
- [ ] Password reset tested if applicable
- [ ] Session expiry tested
- [ ] Refresh-token/session rotation tested
- [ ] Account lockout/rate limiting tested
- [ ] Brute-force protection enabled
- [ ] Authentication events logged

OWASP recommends authentication monitoring and logging, including failed authentication attempts.

## RBAC

Test every role:

- [ ] Super Admin
- [ ] Mandal Admin
- [ ] Treasurer/Accountant
- [ ] Collector
- [ ] Viewer
- [ ] Custom roles

## Individual permissions

Because e-Pavti requires permissions configurable for specific people:

- [ ] Role permissions work
- [ ] Individual permission overrides work
- [ ] Deny overrides work
- [ ] Module-level permissions work
- [ ] Action-level permissions work
- [ ] Permissions enforced on frontend
- [ ] Permissions enforced on backend
- [ ] Permission changes logged

Authorization should default to deny unless explicitly allowed and should be enforced server-side; OWASP also recommends testing function-level and object-level authorization.

---

# PHASE 6 — Receipt System

## Receipt generation

- [ ] Receipt number generated uniquely
- [ ] No duplicate receipt numbers
- [ ] Concurrent collectors cannot create duplicate numbers
- [ ] Receipt numbering works under high load
- [ ] Receipt cancellation works
- [ ] Reissue flow works
- [ ] Receipt status works
- [ ] Paid status works
- [ ] Unpaid status works
- [ ] Pending status works
- [ ] Refunded status works
- [ ] Partial payment works if supported
- [ ] Receipt history preserved

## Receipt templates

- [ ] Default template works
- [ ] Custom template works
- [ ] Mandal logo works
- [ ] Marathi rendering works
- [ ] Hindi rendering works
- [ ] English rendering works
- [ ] QR code works
- [ ] Signature works
- [ ] Thermal printing works
- [ ] PDF generation works
- [ ] PDF download works

## Receipt integrity

- [ ] Receipt cannot be modified without authorization
- [ ] Changes are audited
- [ ] Cancelled receipts remain traceable
- [ ] QR verification cannot expose private donor information
- [ ] Public verification only exposes intended information

---

# PHASE 7 — Donor Management

- [ ] New donor creation
- [ ] Existing donor search
- [ ] Mobile-number search
- [ ] Name search
- [ ] Duplicate donor handling
- [ ] Donation history
- [ ] Repeat donor identification
- [ ] Donor data editing
- [ ] Donor deletion/anonymization policy
- [ ] Donor data export policy
- [ ] Privacy controls

Test with realistic donor volumes.

---

# PHASE 8 — Collections

## Field collection

- [ ] Collector login
- [ ] Collector assigned to Mandal
- [ ] Collector assigned to campaign
- [ ] Collector can create receipt
- [ ] Collector cannot access unauthorized data
- [ ] Collector can view appropriate history
- [ ] Collector cannot manipulate restricted financial records
- [ ] Internal collections work
- [ ] Cash collections work
- [ ] Online collections work
- [ ] Collection reconciliation works

## Offline mode

If implemented:

- [ ] Receipt can be created offline
- [ ] Unique temporary ID generated
- [ ] Offline data stored safely
- [ ] Sync occurs after connectivity returns
- [ ] Duplicate sync prevented
- [ ] Conflict resolution works
- [ ] Failed sync retries
- [ ] User is informed of sync state

---

# PHASE 9 — Payments

This is a **critical launch gate**.

## Gateway

- [ ] Production merchant account approved
- [ ] KYC completed
- [ ] Live credentials configured
- [ ] Test credentials removed from production
- [ ] Payment order creation tested
- [ ] Successful payment tested
- [ ] Failed payment tested
- [ ] Abandoned payment tested
- [ ] Duplicate payment tested
- [ ] Refund tested
- [ ] Partial refund tested if supported

## Webhooks

- [ ] Webhook URL uses production API domain
- [ ] Webhook signature verified
- [ ] Duplicate webhooks handled idempotently
- [ ] Payment captured event handled
- [ ] Payment failed event handled
- [ ] Refund event handled
- [ ] Payment status cannot be spoofed from frontend
- [ ] Payment reconciliation implemented

## Critical test

Never mark:

`PAID`

because the browser reached a success page.

Payment status must be confirmed server-side through the gateway/webhook.

---

# PHASE 10 — WhatsApp / SMS / Email

## WhatsApp

- [ ] Production account approved
- [ ] Business verification completed where required
- [ ] Templates approved where required
- [ ] Receipt delivery tested
- [ ] Failed delivery handled
- [ ] Retry strategy implemented
- [ ] Duplicate message prevention
- [ ] Message status tracked

## SMS

- [ ] Production provider configured
- [ ] DLT requirements completed where applicable
- [ ] Sender ID approved
- [ ] Templates approved
- [ ] Delivery tested
- [ ] Failed delivery handled

## Email

- [ ] SPF
- [ ] DKIM
- [ ] DMARC
- [ ] From address configured
- [ ] Reply-to configured
- [ ] Bounce handling
- [ ] Spam testing
- [ ] Transactional email tested

---

# PHASE 11 — Expense & Financial Management

- [ ] Expense creation
- [ ] Expense categories
- [ ] Beneficiary/vendor details
- [ ] Amount validation
- [ ] Payment method
- [ ] Invoice upload
- [ ] GST fields if supported
- [ ] Expense approval
- [ ] Expense cancellation
- [ ] Expense audit trail
- [ ] Income vs expense calculation
- [ ] Net balance calculation
- [ ] Reports reconcile with transaction records

---

# PHASE 12 — Reports & Analytics

Test:

- [ ] Daily collection
- [ ] Monthly collection
- [ ] Campaign collection
- [ ] Collector-wise collection
- [ ] Donor reports
- [ ] Internal collection
- [ ] Expense reports
- [ ] Income vs expense
- [ ] Paid/unpaid reports
- [ ] Top donors
- [ ] Export PDF
- [ ] Export Excel/CSV where supported

### Financial accuracy test

Take a known dataset.

Calculate the expected result manually.

Then compare:

**Database → API → Dashboard → Export**

Every number must match.

---

# PHASE 13 — Security Hardening

Use the OWASP Application Security Verification Standard as the security baseline. OWASP's ASVS covers architecture, authentication, sessions, access control, validation, cryptography, logging, data protection, communications, file handling, APIs and configuration.

## Secrets

- [ ] No secrets in Git
- [ ] No secrets in frontend
- [ ] No secrets in logs
- [ ] No secrets in error messages
- [ ] Production secrets rotated
- [ ] Database credentials protected
- [ ] Payment secrets protected
- [ ] WhatsApp secrets protected
- [ ] SMS secrets protected
- [ ] Webhook secrets protected

Vercel supports sensitive environment variables that cannot be read back from the dashboard after creation; use that for production secrets where appropriate.

## Web security

- [ ] HTTPS everywhere
- [ ] Secure cookies
- [ ] HttpOnly cookies where appropriate
- [ ] SameSite configured
- [ ] CSRF protection where applicable
- [ ] Content Security Policy reviewed
- [ ] X-Content-Type-Options
- [ ] Referrer-Policy
- [ ] Permissions-Policy
- [ ] Clickjacking protection
- [ ] CORS restricted
- [ ] Rate limiting
- [ ] Brute-force protection

---

# PHASE 14 — File Upload Security

Because e-Pavti may accept:

- Mandal logos
- Signatures
- Expense invoices
- Documents

test:

- [ ] File type validation
- [ ] File size limits
- [ ] MIME validation
- [ ] Filename sanitization
- [ ] Malware scanning strategy
- [ ] Private files not publicly accessible
- [ ] Signed URLs where appropriate
- [ ] Unauthorized download blocked
- [ ] Image processing hardened
- [ ] SVG upload restrictions reviewed

---

# PHASE 15 — Audit Logging

Log important events:

- [ ] Login success
- [ ] Login failure
- [ ] Logout
- [ ] Permission changes
- [ ] User creation
- [ ] User deletion
- [ ] Receipt creation
- [ ] Receipt modification
- [ ] Receipt cancellation
- [ ] Payment events
- [ ] Refunds
- [ ] Expense creation
- [ ] Expense modification
- [ ] Expense approval
- [ ] Organization settings changes
- [ ] Subscription changes
- [ ] Security events

Do NOT log:

- passwords
- access tokens
- payment secrets
- database credentials
- unnecessary sensitive personal information

OWASP specifically recommends logging authentication/access-control events while avoiding secrets and sensitive data in logs.

---

# PHASE 16 — Database Backup & Disaster Recovery

## Backups

- [ ] Automated backups enabled
- [ ] Backup retention defined
- [ ] Backup encryption enabled
- [ ] Backup access restricted
- [ ] Backup monitoring enabled

## Recovery

- [ ] Restore test completed
- [ ] Restore procedure documented
- [ ] Recovery Time Objective defined
- [ ] Recovery Point Objective defined
- [ ] Disaster scenario tested

Your existing checklist correctly calls for both automated backups and a restore drill; keep that as a hard launch requirement.

---

# PHASE 17 — Performance & Scalability

## Frontend

- [ ] Lighthouse test
- [ ] Core Web Vitals tested
- [ ] Mobile performance tested
- [ ] Images optimized
- [ ] Fonts optimized
- [ ] JavaScript bundle reviewed
- [ ] Unnecessary client components removed
- [ ] API calls minimized

## Backend

- [ ] API response times measured
- [ ] Database queries optimized
- [ ] N+1 queries eliminated
- [ ] Pagination implemented
- [ ] Large reports optimized
- [ ] Background jobs implemented for heavy work
- [ ] PDF generation moved out of critical request path where appropriate
- [ ] WhatsApp/SMS processing asynchronous where appropriate

## Peak-load test

Simulate festival traffic.

Test:

- [ ] 100 concurrent users
- [ ] 500 concurrent users
- [ ] 1,000 concurrent users
- [ ] Receipt creation under load
- [ ] Login under load
- [ ] Dashboard under load
- [ ] Report generation under load
- [ ] Payment webhook bursts
- [ ] PDF generation bursts

Record:

- response time
- error rate
- CPU
- memory
- DB connections
- database latency
- queue depth

---

# PHASE 18 — Queue / Background Processing

For heavy operations:

```text
Receipt
   │
   ├── Database → immediate
   │
   └── Queue
         ├── PDF
         ├── WhatsApp
         ├── SMS
         └── Email
```

Test:

- [ ] Job retry
- [ ] Failed job handling
- [ ] Duplicate job prevention
- [ ] Dead-letter strategy
- [ ] Queue monitoring
- [ ] Backpressure handling

This is particularly important for festival-season spikes.

---

# PHASE 19 — Monitoring & Alerting

## Infrastructure monitoring

Monitor:

- [ ] Frontend uptime
- [ ] API uptime
- [ ] Database
- [ ] CPU
- [ ] Memory
- [ ] Disk/storage
- [ ] DB connections
- [ ] Queue depth

## Application monitoring

Monitor:

- [ ] API errors
- [ ] 5xx errors
- [ ] authentication failures
- [ ] payment failures
- [ ] webhook failures
- [ ] WhatsApp failures
- [ ] SMS failures
- [ ] PDF failures
- [ ] slow APIs

## Alerts

Create alerts for:

- [ ] API down
- [ ] Database unavailable
- [ ] High error rate
- [ ] Payment webhook failures
- [ ] Queue backlog
- [ ] Storage approaching limit
- [ ] Backup failure

Your existing checklist already recommends uptime monitoring for both web and API.

---

# PHASE 20 — SEO

## Technical SEO

- [ ] `robots.txt`
- [ ] `sitemap.xml`
- [ ] Canonical URLs
- [ ] Correct metadata
- [ ] Title tags
- [ ] Meta descriptions
- [ ] H1/H2 structure
- [ ] Open Graph metadata
- [ ] Twitter/X metadata
- [ ] Favicon
- [ ] Structured data
- [ ] 404 page
- [ ] 301 redirects
- [ ] No accidental `noindex`
- [ ] No staging pages indexed

## Search Console

- [ ] Google Search Console verified
- [ ] Sitemap submitted
- [ ] Homepage indexed
- [ ] Important pages indexed
- [ ] Indexing errors reviewed
- [ ] Core Web Vitals monitored

## Content

- [ ] Homepage
- [ ] Features
- [ ] Digital Pavti
- [ ] Donation management
- [ ] Expense management
- [ ] Reports
- [ ] UPI donations
- [ ] WhatsApp receipts
- [ ] Pricing
- [ ] FAQ
- [ ] About
- [ ] Contact
- [ ] Blog/resources

---

# PHASE 21 — Legal & Compliance

Public website:

- [ ] Terms & Conditions
- [ ] Privacy Policy
- [ ] Refund/Cancellation Policy
- [ ] Contact information
- [ ] Support information
- [ ] Subscription terms
- [ ] Data ownership terms
- [ ] Payment terms

Application:

- [ ] Privacy consent where required
- [ ] Data deletion process
- [ ] Data export process
- [ ] Account cancellation process
- [ ] Organization ownership defined
- [ ] Donor data handling defined

Do not claim legal compliance merely because these pages exist; have the applicable policies reviewed appropriately before launch.

---

# PHASE 22 — Mobile / PWA

## Android

- [ ] Chrome
- [ ] Samsung Internet
- [ ] Different screen sizes
- [ ] Low-end Android device
- [ ] 4G
- [ ] Slow network
- [ ] Intermittent network

## iPhone/iOS

- [ ] Safari
- [ ] PWA installation
- [ ] Login
- [ ] Receipt creation
- [ ] PDF
- [ ] WhatsApp sharing

## Field test

A collector should be able to:

**Login → Find donor → Enter amount → Generate Pavti**

in approximately **15–30 seconds** under normal conditions.

Your existing checklist already identifies this as a key field-usability test.

---

# PHASE 23 — Thermal Printing

Test:

- [ ] 58mm printer
- [ ] 80mm printer
- [ ] Bluetooth printer
- [ ] Android
- [ ] Browser print
- [ ] Marathi
- [ ] Hindi
- [ ] English
- [ ] QR readability
- [ ] Logo clarity
- [ ] Long donor names
- [ ] Large amounts
- [ ] Long addresses

---

# PHASE 24 — Real-World Pilot

Before public launch:

### Pilot with 5–10 Mandals

Each should perform:

- [ ] Organization registration
- [ ] Add collectors
- [ ] Add donors
- [ ] Create campaign
- [ ] Issue receipts
- [ ] Print receipts
- [ ] Send WhatsApp receipt
- [ ] Collect online payment
- [ ] Record internal collection
- [ ] Record expenses
- [ ] Generate reports
- [ ] Test permissions
- [ ] Test cancellation
- [ ] Test end-of-day reconciliation

Collect:

- time to create receipt
- errors
- collector feedback
- donor feedback
- missing features
- support requests

Your current launch plan already proposes starting with 5–10 friendly Mandals, which I would retain.

---

# PHASE 25 — Festival Stress Test

Before a major festival:

Simulate:

```text
100 collectors
      ↓
10,000 receipts
      ↓
Payments
      ↓
PDF generation
      ↓
WhatsApp
      ↓
Reports
```

Then test a much larger synthetic load.

The goal is to discover:

- database bottlenecks
- duplicate receipt problems
- queue failures
- payment webhook bursts
- report performance issues
- storage issues

**before real donors encounter them.**

---

# PHASE 26 — Production Deployment Process

Never deploy directly without a controlled process.

Recommended:

```text
Developer
    ↓
Git
    ↓
Pull Request
    ↓
Automated Tests
    ↓
Preview Deployment
    ↓
Staging
    ↓
QA
    ↓
Production
```

## Deployment

- [ ] Production branch protected
- [ ] Required review enabled
- [ ] CI tests passing
- [ ] Build passing
- [ ] Database migration tested
- [ ] Rollback plan ready
- [ ] Previous production version identifiable
- [ ] Deployment owner identified

---

# PHASE 27 — Final Security Review

Before launch, perform a dedicated security review.

At minimum:

- [ ] Authentication testing
- [ ] Authorization testing
- [ ] Multi-tenant isolation testing
- [ ] IDOR/BOLA testing
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing where applicable
- [ ] File upload testing
- [ ] Rate-limit testing
- [ ] Session testing
- [ ] API security testing
- [ ] Secret exposure scan
- [ ] Dependency vulnerability scan

For a product handling financial and donor information, consider an independent penetration test before significant scale.

---

# PHASE 28 — Launch-Day Checklist

## Before launch

- [ ] Database backup verified
- [ ] Latest production deployment verified
- [ ] Payment gateway verified
- [ ] Webhooks verified
- [ ] WhatsApp verified
- [ ] SMS verified
- [ ] Email verified
- [ ] Monitoring active
- [ ] Alerts active
- [ ] Search Console verified
- [ ] Sitemap submitted
- [ ] Legal pages live
- [ ] Support email working
- [ ] Support process ready
- [ ] Rollback plan ready

## Launch test

Perform one complete real flow:

```text
Mandal Registration
       ↓
Subscription
       ↓
Mandal Setup
       ↓
Collector Creation
       ↓
Donor Creation
       ↓
Donation
       ↓
Payment
       ↓
Webhook
       ↓
Receipt
       ↓
WhatsApp
       ↓
Report
       ↓
Expense
       ↓
Final Balance
```

Everything must work.

---

# PHASE 29 — Post-Launch Monitoring

For the first 24–72 hours:

- [ ] Monitor errors continuously
- [ ] Monitor payment failures
- [ ] Monitor webhook failures
- [ ] Monitor database
- [ ] Monitor API latency
- [ ] Monitor user registrations
- [ ] Monitor receipt creation
- [ ] Monitor WhatsApp delivery
- [ ] Monitor support requests
- [ ] Review logs
- [ ] Review Search Console

Do not immediately start adding features after launch.

First stabilize the product.

---

# FINAL GO / NO-GO GATE

e-Pavti should be considered **READY FOR PUBLIC LAUNCH** only when all of these are true:

- [ ] No critical security vulnerabilities
- [ ] No critical payment issues
- [ ] No cross-Mandal data leakage
- [ ] Database backup + restore verified
- [ ] Production monitoring active
- [ ] Error monitoring active
- [ ] Payment webhooks verified
- [ ] Receipt numbering proven safe under concurrency
- [ ] Core user flow tested on real mobile devices
- [ ] Peak-load testing completed
- [ ] Legal pages live
- [ ] SEO foundation complete
- [ ] Search Console configured
- [ ] 5–10 pilot organizations tested
- [ ] Rollback procedure tested
- [ ] Support process ready

# GOLDEN RULE

**If any of these are false, don't call the system production-ready.**

The goal is not:

> "The website is online."

The goal is:

> **"A Mandal can safely trust e-Pavti with its collections, receipts, donor records and financial data.",**
