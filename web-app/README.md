# Travel Lounge — Luxury Travel Ecosystem

> **Unified booking, management, and concierge platform** targeting the premium travel segment. Three interconnected applications sharing one Supabase backend.

---

## 📦 The Three Applications

| App | Stack | Role | Deploy |
|---|---|---|---|
| **Web App** | Next.js 15 · Tailwind CSS v4 · Framer Motion | Guest-facing storefront & booking engine | Vercel |
| **Admin Portal** | Vite · React 19 · Ant Design | Operator mission control & CMS | Vercel |
| **Mobile App** | Expo SDK 52 · React Native · NativeWind | On-the-go concierge & discovery | EAS (iOS + Android) |

All three share a single **Supabase** (PostgreSQL) backend via the `create_booking_v1` RPC and a unified data model.

---

## 🚀 Quick Start

### Web App
```bash
cd web-app
npm install
# create .env.local with NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev        # http://localhost:3000
npm run build      # production bundle
```

### Admin Portal
```bash
cd admin-app
npm install
npm run dev        # http://localhost:5173
npm run build
```

### Mobile App
```bash
cd mobile-app
npm install
npx expo start                                          # dev client
npx eas build --profile preview --platform android     # APK
npx eas build --profile production --platform ios      # App Store
```

---

## 📖 Documentation Index

| Doc | Purpose |
|---|---|
| [PROJECT_RULES.md](./PROJECT_RULES.md) | Unified compliance, quality gates, and standards. |
| [01 Overview](./docs/01_overview.md) | High-level ecosystem and mission statement. |
| [02 Architecture](./docs/02_architecture.md) | Technical stack and infrastructure details. |
| [03 Features](./docs/03_features.md) | Detailed catalog of Guest and Admin features. |
| [04 Development](./docs/04_development.md) | Setup, contribution, and deployment guide. |
| [05 History](./docs/05_history.md) | Full development log and audit trail. |
| [MIGRATION_GUIDE](./docs/MIGRATION_GUIDE.md) | Legacy migration and data sync guide. |
| [09 Sales Kit](./docs/09_sales_kit.md) | Value propositions and ROI for stakeholders. |

---

## 🔑 Environment Variables

Both web and admin need a Supabase URL and anon key. Mobile reads from `.env`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## 🎨 Brand Identity

- **Primary colour**: `red-600`
- **Typography**: Outfit Black (900) · Slate-300 palette
- **Motion**: Framer Motion (web) · React Native Reanimated (mobile)
- **Branding source of truth**: `site_settings` table in Supabase — no re-deploy needed to update logos or colours.
