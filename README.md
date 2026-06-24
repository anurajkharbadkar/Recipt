# Digital Pavti Book — डिजिटल पावती बुक

> Production-grade digital receipt management platform for Indian religious & community organizations.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- pnpm v9+
- Docker (for local Postgres)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start local database
docker-compose up -d

# 3. Run migrations + seed
pnpm db:migrate
pnpm db:seed

# 4. Start both apps (dev mode)
pnpm dev
```

### Access
| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| API | http://localhost:3001/api/v1 |
| Swagger | http://localhost:3001/api/docs |
| DB Studio | `pnpm db:studio` |

### Demo Credentials
| Role | Phone | Password |
|------|-------|----------|
| Admin | 9876543210 | Admin@123 |
| Collector | 9123456001 | Collector@123 |
| Treasurer | 9123456004 | Admin@123 |

## 🏗️ Architecture

```
digital-pavti-book/
├── apps/
│   ├── web/          ← Next.js 14 PWA (port 3000)
│   └── api/          ← NestJS REST API (port 3001)
├── packages/
│   └── shared/       ← Shared types & utilities
├── prisma/           ← (in apps/api/prisma)
└── docker-compose.yml
```

## ✨ Features

- **Digital Pavti Generation** — Traditional receipt design with QR code
- **WhatsApp Sharing** — Instant receipt delivery to donor
- **PDF Export** — Print-ready A5 Pavti via Puppeteer
- **Multilingual** — English / Hindi / Marathi
- **Role-based Access** — Admin, Treasurer, Collector, Viewer
- **Analytics Dashboard** — Recharts-powered reports
- **Offline PWA** — Works without internet (installable on phone)
- **Audit Trail** — Every action logged
- **CSV Export** — Download all receipts
- **QR Verification** — Scan to verify any receipt

## 🔧 Configuration

### API (apps/api/.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
MSG91_API_KEY=             # OTP (MSG91)
WHATSAPP_ACCESS_TOKEN=     # WhatsApp Business Cloud API
R2_BUCKET_NAME=            # Cloudflare R2
RAZORPAY_KEY_ID=           # UPI Payments
```

### Web (apps/web/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 🚢 Deployment

### Frontend → Vercel
```bash
cd apps/web && vercel --prod
```

### Backend → Railway
```bash
railway up
```

## 📱 PWA Installation

Open http://localhost:3000 on Android Chrome → "Add to Home Screen"
