# F&O Trade Tracker

A professional Futures & Options trading journal and analytics platform built with Next.js 15, Supabase, and Tailwind CSS.

## ✨ Features

- **Dashboard** — Today's P&L, monthly P&L, win rate, profit factor, equity curve, recent trades
- **Trade Management** — Add/edit/delete futures and options trades, trade book with filters, sort, pagination
- **Rollover Management** — Track positions across multiple expiries with full chain history
- **Trade Journal** — Entry/exit reasons, mistakes, lessons, star rating per trade
- **Analytics** — Equity curve, monthly P&L chart, strategy breakdown, win/loss distribution
- **Strategy Analysis** — Performance by strategy, futures vs options, intraday vs positional
- **Reports** — Export to Excel (xlsx), PDF, and CSV
- **Calendar View** — Daily P&L heatmap with profit/loss day tracking
- **Settings** — Profile, broker, strategy master, backup & restore

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) |
| UI | Tailwind CSS + Shadcn UI |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Charts | Recharts |
| Excel Export | SheetJS (xlsx) |
| PDF Export | jsPDF + AutoTable |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Deployment | Vercel |

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd fo-trade-tracker
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the entire contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings → API**

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register, Forgot Password
│   ├── (app)/               # Protected app routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── trades/          # Trade book + add/edit/view
│   │   ├── rollovers/       # Rollover chains
│   │   ├── journal/         # Trade journal
│   │   ├── analytics/       # Charts & analytics
│   │   ├── strategy/        # Strategy analysis
│   │   ├── reports/         # Export reports
│   │   ├── calendar/        # Calendar P&L view
│   │   └── settings/        # User settings
│   └── layout.tsx
├── components/
│   ├── ui/                  # Shadcn UI primitives
│   ├── dashboard/           # Dashboard widgets
│   ├── trades/              # Trade form, table, filters
│   ├── layout/              # Sidebar navigation
│   └── rollovers/           # Rollover components
├── hooks/
│   ├── use-trades.ts        # Trade CRUD + fetch
│   ├── use-rollovers.ts     # Rollover CRUD + fetch
│   └── use-toast.ts         # Toast notifications
├── lib/
│   └── supabase/            # Client, server, middleware
├── store/
│   └── trade-store.ts       # Zustand global state
├── types/
│   └── index.ts             # All TypeScript types
└── utils/
    ├── trade.ts             # P&L calculations, formatting
    └── export.ts            # Excel, PDF, CSV export
supabase/
└── schema.sql               # Full DB schema + RLS + triggers
```

## 🗄 Database Schema

| Table | Description |
|---|---|
| `profiles` | Extended user profiles |
| `strategies` | User-defined trading strategies |
| `trades` | All futures & options trades |
| `rollover_chains` | Position rollover chains |
| `rollovers` | Individual rollover events |
| `trade_journals` | Journal entries per trade |
| `user_settings` | Per-user preferences |

Views: `daily_pnl`, `monthly_pnl`

Row Level Security (RLS) is enabled on all tables — users only see their own data.

## 🚢 Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set these environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📊 Lot Sizes (pre-configured)

| Symbol | Lot Size |
|---|---|
| NIFTY | 25 |
| BANKNIFTY | 15 |
| FINNIFTY | 40 |
| MIDCPNIFTY | 75 |

More lot sizes can be updated in `src/utils/trade.ts` → `LOT_SIZES`.

## 🔐 Authentication Flow

1. User registers → Supabase Auth creates user
2. DB trigger auto-creates `profiles` record
3. DB trigger auto-creates 5 default strategies
4. Middleware protects all `/dashboard`, `/trades`, etc. routes
5. Unauthenticated users are redirected to `/login`

## 📈 P&L Calculation

```
Gross P&L = (Exit - Entry) × Qty × Lot Size   [BUY]
Gross P&L = (Entry - Exit) × Qty × Lot Size   [SELL]
Net P&L   = Gross P&L - Charges
```

P&L is auto-computed via a Postgres trigger on insert/update.

## 🤝 Contributing

PRs welcome. Please open an issue first to discuss major changes.

## 📄 License

MIT
