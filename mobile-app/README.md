# Travel Lounge: Elite Mobile Application

A High-Engagement Concierge Interface for the Travel Lounge ecosystem, built with Expo and React Native.

---

## 📖 Standardized Documentation

| # | Doc | Purpose |
|---|---|---|
| 01 | [Overview & Ecosystem](./docs/01_overview.md) | Vision and the "Elite" tech stack |
| 02 | [Architecture & Flow](./docs/02_architecture.md) | Repository structure and screen routes |
| 03 | [Database & Data Model](./docs/03_database.md) | Supabase tables, RPCs, and mobile usage |
| 04 | [Development Guide](./docs/04_development.md) | Local setup, EAS build, and troubleshooting |
| 05 | [Development Progress Log](./docs/05_history.md) | Historical milestones and audit trail |
| 09 | [Sales Kit](./docs/09_sales_kit.md) | Mobile value propositions for stakeholders |

---

## 🚀 Quick Start
1. **Dependencies**: `npm install`
2. **Launch**: `npx expo start`
3. **Build APK**: `npx eas build --profile preview --platform android`

**Environment** — create `.env` in root:
```env
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_API_URL=https://<web-app>.vercel.app
```

---

## 💎 Elite Alignment
For ecosystem-wide context, refer to:
- [Web Application](../web-app/README.md)
- [Admin Portal](../admin-app/README.md)
