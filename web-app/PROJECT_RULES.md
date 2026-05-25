# PROJECT_RULES.md
## Unified Project Rules & Compliance Framework
Generated: 2026-05-12
Version: 4.0 — Consolidated & Authoritative

### 1. MISSION CRITICAL CONSTRAINTS
- **GEMINI.md**: Never delete, edit, or change this file.
- **Protected Folders**: Never delete `docs/`, `postman/`, `scripts/`, or `tests/`.
- **Code Removal**: Never remove existing code; comment it out instead and ensure no other agent deletes it.
- **Consent**: Do not implement any updates, changes, or edits without explicit user consent.
- **Environment**: OS is Windows 11. Use PowerShell/CMD commands only (e.g., `del` not `rm`).

### 2. CODE QUALITY & STANDARDS
- **Rule 1: Documentation Integrity**: Maintain 100% current docs. Every change must be logged in `docs/05_history.md`.
- **Rule 2: Automated Validation**: All code must pass linting and `npm run build`.
- **Rule 3: Pattern Restrictions**: Prohibit `var`, `eval`, `innerHTML`, `document.write`. Use `const/let` and Zod.
- **Rule 4: Clean Production**: Remove all `console.log` statements before deployment.

### 3. FILE ORGANIZATION & STRUCTURE
- **Standard Directories**: `app/`, `components/`, `assets/`, `tests/`, `docs/`, `scripts/`, `constants/`, `lib/`, `hooks/`, `supabase/`.
- **Naming Conventions**:
  - `PascalCase` → Components (`BookingWizard.tsx`)
  - `camelCase` → Utilities/Hooks (`usePageContent.ts`)
  - `UPPER_SNAKE_CASE` → Constants
- **Placement**:
  - `.tsx` → `components/` or `app/`
  - `.ts` → `lib/` or `types/`
  - `.sql` → `supabase/migrations/`

### 4. UI/UX & AESTHETIC STANDARDS
- **Boutique Branding**: Standardize on `Red-600` primary theme, `Outfit` typography, and `Slate-300` palette.
- **Visual Excellence**: Use glassmorphism, vibrant colors, and smooth micro-animations. Avoid generic browser defaults.
- **Full-Page Experience**: **MANDATORY**: Use dedicated routes/pages instead of modals or popups for primary booking and inquiry forms.
- **Mobile First**: Minimum font size for labels is `11px`. Ensure all elements fit 320px viewports without overflow.
- **Assets**: Use authoritative production assets (e.g., `https://travellounge.mu/assets/logo.png`).

### 5. STATE & PERFORMANCE
- **State Management**: Use React Context for global state and React Query for server state.
- **Optimization**: Use `useMemo` and `useCallback` to prevent unnecessary re-renders. Maintain existing image handling and splash screen behavior.
- **Performance**: Maintain fast load times and smooth transitions using `framer-motion`.

### 6. SECURITY & DATA HANDLING
- **Supabase**: Adhere to strict Row Level Security (RLS). Never bypass RLS in frontend code.
- **Sanitization**: Sanitize all user inputs and follow existing authentication rules.
- **Persistence**: Use the `create_booking_v1` RPC for all booking submissions.

### 7. CHANGE MANAGEMENT WORKFLOW
1. **Analyze**: Map dependencies and review current file states.
2. **Simulate**: Perform dry-runs and validate syntax.
3. **Implement**: Apply targeted changes without destructive side effects.
4. **Verify**: Run automated tests and manual UI checks.
5. **Log**: Update `docs/05_history.md` and commit with descriptive messages.
