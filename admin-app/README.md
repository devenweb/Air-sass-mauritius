# Royal Travel Agency: Strategic Admin Portal

The mission control for service providers, allowing real-time management of inventories, bookings, and site settings.

---

## 📖 Standardized Documentation

| # | Doc | Purpose |
|---|---|---|
| 01 | [Overview & Ecosystem](./docs/01_overview.md) | Vision and the "Elite" tech stack |
| 02 | [Architecture & Flow](./docs/02_architecture.md) | Repository structure and design standards |
| 03 | [Database & Data Model](./docs/03_database.md) | Supabase schema, RLS, and RPC logic |
| 04 | [Development Guide](./docs/04_development.md) | Local setup and build processes |
| 05 | [Development Progress Log](./docs/05_history.md) | Historical milestones and audit trail |
| 06 | [User Guide](./docs/06_user_guide.md) | Admin portal user manual |
| 07 | [RLS Diagnosis](./docs/07_rls_diagnosis.md) | Row-Level Security fix reference |
| 08 | [Price Manager](./docs/08_pricing_manager.md) | Seasonal pricing grid documentation |
| 09 | [Sales Kit](./docs/09_sales_kit.md) | Value propositions for stakeholders |
| — | [Screen Audit](./docs/interface_and_screen_audit.md) | Full UI/screen architectural audit |

---

## 🚀 Quick Start
1. **Dependencies**: `npm install`
2. **Launch**: `npm run dev` → http://localhost:5173
3. **Build**: `npm run build`

**Environment** — create `.env` in root:
```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

---

## 💎 Elite Alignment
For ecosystem-wide context, refer to:
- [Web Application](../web-app/README.md)
- [Mobile Application](../mobile-app/README.md)
