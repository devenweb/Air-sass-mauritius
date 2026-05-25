# 04 Development & Contribution Guide

## Getting Started
The Travel Lounge ecosystem is optimized for local development across three core workspaces.

### Prerequisites
- **Node.js**: 18+ (LTS recommended)
- **Supabase CLI**: For local database testing (optional)
- **Environment**: `.env.local` must contain valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Workflow
1.  **Web App**: `npm run dev` (Runs on Port 3000)
2.  **Admin App**: `npm run dev` (Runs on Port 5173)
3.  **Mobile App**: `npx expo start` (Runs via Expo Go)

---

## Technical Standards
To maintain the "Boutique Elite" status of the codebase, all contributors must follow these rules:

### Styling (CSS & Tailwind)
- Use **Tailwind CSS** for all layout and spacing.
- Use **Vanilla CSS** in `globals.css` only for global resets and `.rdp-day` (calendar) overrides.
- Prefer `rounded-[2rem]` or `rounded-full` for the boutique pill aesthetic.

### UI Components
- **Modals**: All date selection and critical forms must use centered fixed modals with `backdrop-blur-sm`.
- **Animations**: Use `framer-motion` for page transitions (`AnimatePresence`) and interactive hover states.
- **Icons**: Standardize on `lucide-react`.

### State Management
- Use **React Context API** for global site settings.
- Use **React Query (or local hooks)** for relational data fetching.
- Use **Zod + React Hook Form** for all guest-facing input validation.

---

## Specialized Infrastructure

### Email Template Management
Transactional emails are managed via the `public.email_templates` table in Supabase.
- **Update Script**: Use `npx ts-node scripts/update_email_templates.ts` to push local template changes to the database.
- **Service-Aware Logic**: Templates support `raw:` variable prefixes for HTML injection and CSS-based row visibility toggles for dynamic category rendering.

---

## Deployment
- **Production**: Vercel (Auto-deploy from `main` branch).
- **Environment Management**: Never hardcode keys; use the Admin site settings table for dynamic branding tokens.
- **Location Context**: Global site uses the `isMauritiusRoute` utility to display location-aware contact pages.
