# 02 Architecture & Flow

## Repository Structure (Production Standard)
The **Admin App** follows a modular architecture designed for high-performance administrative tasks.

- **`src/pages/`**: Primary administrative modules (Dashboard, Services, Bookings, Settings).
- **`src/components/`**: Elite UI components (Complex tables, form wizards, and interactive charts).
- **`src/utils/`**: Core logic for asset resolution (`image.js`) and API interaction.
- **`docs/`**: Centralized documentation and historical logs.
- **`scripts/`**: Utility scripts for data migration and system audits.
- **`supabase/`**: Local SQL patterns and site-wide configuration defaults.

---

## Component Logic Flow
1. **Global Site Settings**: Fetched on initialization to define the UI's visual identity (logos, dimensions).
2. **Dynamic CMS Modules**: Components synchronize their state directly with Supabase to ensure real-time content updates across the ecosystem.
3. **Asset Resolution Engine**: Centralized utility resolves local versus remote (Supabase) assets to eliminate 404 errors.

---

## UI Standards
- **Elite Rounding**: Consistent 24px-32px rounding across all cards and buttons.
- **Typography**: **Outfit (900)** for primary headings; **Inter** for readability in data tables.
- **Color Palette**: Custom **Slate-300** high-definition borders on a professional dark/light base.
