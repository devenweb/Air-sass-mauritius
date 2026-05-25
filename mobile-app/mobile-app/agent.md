---
name: repository-agent
description: Agent operating guide for the Travel Lounge Mobile App.
---

# Agent — Mobile App

## Project Context
This is the **Travel Lounge Mobile App** — an Expo SDK 52 + React Native application.
- **Framework**: Expo SDK 52 (Expo Router v3)
- **Styling**: NativeWind (Tailwind CSS for Native)
- **UI**: React Native Paper + Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build**: EAS Build (`devenweb` account — devenpawaray@gmail.com)

## Key Directories
- `app/` — Expo Router screens and tab layout (`(tabs)/index`, `(tabs)/explore`, `(tabs)/bookings`, `(tabs)/profile`)
- `components/` — Reusable UI: `ServiceCard`, `CategoryCard`, `PremiumCarousel`, `BookingModal`
- `hooks/` — Custom hooks: `useCustomerBookings`, data fetching hooks
- `lib/` — Supabase client, utility functions
- `constants/` — Design tokens, colors, theme
- `assets/` — Thematic images (JPEG) and icons

## Core Rules
- Keep changes small, targeted, and easy to review.
- Preserve existing NativeWind class patterns — do not introduce StyleSheet-only components.
- Respect Expo Router file-based routing — new screens go in `app/`.
- Never hardcode Supabase credentials — use `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- Do not rename JPEG assets to `.png` — EAS build will fail during AAPT resource merging.

## Workflow
1. Read the relevant screen in `app/` and its hooks before editing.
2. Implement the smallest viable change.
3. Validate: `npx expo start` with no TypeScript/lint errors.
4. For production: `npx eas build --profile preview --platform android`.
5. Summarize what changed and any remaining risks.

## Code Style
- Match existing NativeWind + React Native Paper component patterns.
- Use `expo-image` for all images (not React Native's `<Image>`).
- Prefer explicit, readable logic. Add brief comments for non-obvious logic.
- Icon standard: `lucide-react-native`.

## Known Gotchas
- **Android Authorization**: If device shows "not authorized," run `npx expo start --localhost` to authorize.
- **react-native-screens patch**: Current version is 4.4.0 — if patch-package fails, regenerate with `npx patch-package react-native-screens`.
- **EAS Account**: Always ensure `app.json` has `owner: "devenweb"` before building.

## Notes
- Repository conventions may evolve; update this file when team norms change.
