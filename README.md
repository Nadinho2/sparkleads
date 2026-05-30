# Pre-Deploy Checklist

- [ ] Google Places API key added to Vercel env
- [ ] Paystack keys added to Vercel env
- [ ] Supabase URL + keys added to Vercel env
- [ ] NEXT_PUBLIC_APP_URL set to production domain
- [ ] Supabase schema.sql run in production Supabase project
- [ ] Paystack webhook URL configured: `https://yourdomain.com/api/paystack/webhook`
- [ ] Test free trial search works
- [ ] Test payment flow end to end
- [ ] Test activation link flow
- [ ] Test dashboard search
- [ ] Test CSV export

---

# SparkLeads

A SaaS lead generation tool that finds 200+ business leads in 60 seconds using the Google Places API. Search any business type in any city worldwide and get real phone numbers, emails, addresses, and Google ratings — then export to CSV and start outreach immediately.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript strict mode)
- **Styling**: Tailwind CSS (dark theme design system)
- **Database**: Supabase (PostgreSQL)
- **API**: Google Places (Text Search + Details)
- **Payments**: Paystack
- **Hosting**: Vercel

## Features

- Live streaming search results via SSE (Server-Sent Events)
- Real phone numbers, emails, addresses, and Google ratings
- One-click CSV export
- Lead status tracking (new, contacted, interested, closed, not interested)
- WhatsApp-ready phone formatting
- Free trial (2 searches) with paywall
- Affiliate program with 50% commission ($7.50 per sale)
- Payout requests with bank details
- Email discovery from business websites
- In-memory caching (5-min TTL) to reduce API costs
- Rate limiting on API routes
- Full SEO setup (sitemap, robots.txt, JSON-LD, OpenGraph)

## Local Setup

### Prerequisites

- Node.js 18+ 
- npm
- A Supabase project
- A Google Cloud project with Places API enabled
- A Paystack account

### 1. Clone and install

```bash
git clone <your-repo-url>
cd sparkleads
npm install
```

### 2. Set up environment variables

Copy `.env.production` to `.env.local` and fill in the values:

```bash
cp .env.production .env.local
```

See the [Environment Variables](#environment-variables) section below for details on each variable.

### 3. Set up the database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/schema.sql` and run it
4. This creates all 7 tables with RLS policies and indexes

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production (optional)

```bash
npm run build
npm start
```

To analyze the bundle size:

```bash
ANALYZE=true npm run build
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Google Places API key for searching businesses | Yes |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key for payment checkout | Yes |
| `PAYSTACK_SECRET_KEY` | Paystack secret key for server-side payment verification | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key (client-side) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side, bypasses RLS) | Yes |
| `NEXT_PUBLIC_APP_URL` | The base URL of your app (e.g. `http://localhost:3000` or `https://yourdomain.com`) | Yes |
| `NEXT_PUBLIC_APP_NAME` | App display name (default: `SparkLeads`) | No |

## Where to Get API Keys

### Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** (under APIs & Services > Library)
4. Go to APIs & Services > Credentials
5. Click **Create Credentials** > **API Key**
6. Restrict the key to **Places API** only
7. Set the key as `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

### Paystack

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to **Settings** > **API Keys & Webhooks**
3. Copy your **Public Key** → `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
4. Copy your **Secret Key** → `PAYSTACK_SECRET_KEY`
5. Set webhook URL to `https://yourdomain.com/api/paystack/webhook`

### Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to **Settings** > **API**
4. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
7. Go to SQL Editor and run the contents of `supabase/schema.sql`

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** > **Project**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 3. Configure environment variables

In the Vercel project settings, go to **Settings** > **Environment Variables** and add all variables from the [Environment Variables](#environment-variables) section.

**Important**: Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://sparkleads.vercel.app` or your custom domain).

### 4. Deploy

Click **Deploy**. Vercel will build and deploy automatically.

### 5. Post-deploy

1. Run `supabase/schema.sql` in your production Supabase project (if not done already)
2. Configure Paystack webhook URL to `https://yourdomain.com/api/paystack/webhook`
3. Test the health endpoint: `GET /api/health`
4. Go through the [pre-deploy checklist](#pre-deploy-checklist) above

## Project Structure

```
sparkleads/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── activate/        # Activation flow
│   │   │   ├── affiliate/       # Affiliate stats + payout
│   │   │   ├── export-csv/      # CSV export
│   │   │   ├── health/          # Health check endpoint
│   │   │   ├── leads/           # Lead status updates
│   │   │   ├── search/          # SSE streaming search
│   │   │   ├── searches/        # Search history CRUD
│   │   │   └── user/            # User operations
│   │   ├── dashboard/           # Dashboard pages
│   │   │   ├── affiliate/       # Affiliate dashboard
│   │   │   ├── history/         # Search history
│   │   │   └── settings/        # Account settings
│   │   ├── freetrial/           # Free trial page
│   │   ├── activate/            # Activation page
│   │   ├── checkout/            # Checkout page
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   ├── error.tsx            # Global error boundary
│   │   ├── not-found.tsx        # Custom 404
│   │   ├── loading.tsx          # Global loading state
│   │   ├── sitemap.ts           # Dynamic sitemap
│   │   └── robots.ts            # Robots.txt
│   ├── components/
│   │   ├── dashboard/           # Dashboard components
│   │   └── ui/                  # Reusable UI components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/
│   │   ├── auth.ts              # Auth utilities
│   │   ├── cache.ts             # In-memory cache (5-min TTL)
│   │   ├── google-places.ts     # Google Places API integration
│   │   ├── rate-limit.ts        # In-memory rate limiting
│   │   └── supabase.ts          # Supabase clients
│   ├── types/                   # TypeScript types
│   └── middleware.ts            # Route protection
├── supabase/
│   └── schema.sql               # Database migration
├── vercel.json                  # Vercel deployment config
├── next.config.mjs              # Next.js config (headers, bundle analyzer)
├── tailwind.config.ts           # Tailwind theme
└── package.json
```

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/search` | Stream search results via SSE |
| POST | `/api/leads/update-status` | Update lead status |
| POST | `/api/export-csv` | Export leads as CSV |
| POST | `/api/searches/delete` | Delete a search and its leads |
| GET | `/api/searches/[id]/leads` | Get leads for a search |
| GET | `/api/affiliate/stats` | Get affiliate stats |
| POST | `/api/affiliate/payout` | Request a payout |
| GET | `/api/activate` | Activate account with token |
| DELETE | `/api/user/clear-history` | Clear all user data |
| GET | `/api/health` | Health check endpoint |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `ANALYZE=true npm run build` | Build with bundle analyzer |

## License

Proprietary. All rights reserved.
