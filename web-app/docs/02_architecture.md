# 02 Architecture & Infrastructure

## The Triple-App Suite
Travel Lounge uses a unified backend architecture where three distinct applications consume a single source of truth:

1.  **Web App (Next.js)**: Optimized for SEO and guest conversion.
2.  **Admin App (Vite/React)**: Optimized for speed and operational efficiency.
3.  **Mobile App (Expo)**: Optimized for on-the-go concierge services.

---

## Data & Persistence
The architecture has transitioned from standalone JSONB "ghost" data to a **Strict Relational Schema** to ensure data integrity and real-time synchronization.

### Relational Pricing Strategy
All service rates are managed in the `service_pricing` table, which supports:
- **Variant Scoping**: Prices are tied to specific room types or activity variants via `variant_id`.
- **Seasonal Overrides**: Date-range records allow for mass price propagation.
- **Stop-Sell Toggles**: A relational boolean flag that immediately disables booking dates across all guest-facing surfaces.

### Global CMS Synchronization
Content across all pages (titles, hero images, subtitles) is driven by the `cms_content` table.
- **Hook-Driven**: Guest apps use the `usePageContent` hook for real-time hydration.
- **Slug-Based**: Pages are identified by canonical slugs (e.g., `hotels`, `about`, `mauritius`), allowing for instant global updates from the Admin CMS module.

---

## Core Systems
- **Pricing Engine**: A centralized TypeScript module (`pricingEngine.ts`) that aggregates base rates, seasonal overrides, and additive meal supplements.
- **Email Engine**: A Supabase-triggered notification system that delivers boutique-styled inquiry and booking confirmations.
- **Inventory Guardrails**: A frontend-enforced system that uses centered-modal calendars to block unavailable dates based on relational inventory stock.
- **Flight Search Engine**: The `/flights` page integrates the GOL IBE D4 engine, handling dynamic height and `postMessage` events for cross-tab communication.
- **Checkout Logic**: The `BookingWizard` manages transient state and submits finalized payloads to the `create_booking_v1` RPC.
- **Global Promotional Layer**: The `<AnnouncementPopup />` is integrated at the root layout level, providing a synchronized promotional surface across all routes. It consumes real-time site settings to toggle global visibility and seasonal offers instantly.

---

## Elite standards (UI/UX)
- **Primary Red Theme**: Switched entirely to `red-600` from legacy blue for a bold, luxury aesthetic.
- **Compact Layouts**: Minimal padding and gaps on mobile/web forms for a tighter, more professional feel.
- **Visual Parity**: Uses standardized paths (e.g., `/assets/heroes/`) to ensure visual consistency with mobile/admin.
- **Design Tokens**: Standardized on **Outfit Black (900)** and a high-definition **Slate-300** palette.
