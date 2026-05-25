# 02 Architecture & Flow

## Repository Structure
The **Mobile App** leverages a modern Expo Router architecture for seamless navigation and modularity.

- **`app/`**: Expo Router-based screens, tabs, and layout configurations.
  - `(tabs)/index.tsx` — Home / Hero Carousel
  - `(tabs)/explore.tsx` — Filter-driven discovery
  - `(tabs)/bookings.tsx` — Personal booking history
  - `(tabs)/profile.tsx` — User profile
  - `services/[id].tsx` — Service detail & booking
- **`components/`**: Elite modular UI components (e.g., `ServiceCard`, `CategoryCard`, `PremiumCarousel`, `BookingModal`).
- **`hooks/`**: Custom React hooks for data fetching (e.g., `useCustomerBookings`).
- **`lib/`**: Supabase client, utility functions, `imageUtils.ts` resolution engine.
- **`constants/`**: Centralized design tokens (colors, typography, spacing).
- **`assets/`**: Standardized thematic images (JPEG) and icons.

---

## Component Logic Flow
1. **Dynamic Initialization**: On launch, the app fetches site settings and promotional popup ads from Supabase.
2. **Image Resolution Engine**: `lib/imageUtils.ts` maps database paths to local fallback assets or Supabase storage buckets, handling format normalization (e.g., JPEG vs PNG).
3. **Flight Booking Flow**: Integrated via `react-native-webview` to render the GOL IBE D4 engine natively within the app.
4. **Hero Carousel Navigation**: Hero banner buttons use `router.push()` from `expo-router` to navigate to destination routes (`/services?category=hotels`, etc.).

---

## Elite Design Standards (11/10)
- **Typography**: **Outfit Black (900)** for impactful headers.
- **Palette**: **Slate-300** high-definition borders on executive backgrounds.
- **Geometry**: Extreme 32px-40px rounding on all interactive elements.
- **Performance**: Zero-flicker image loading via `expo-image` with server-side optimization.
- **Icons**: `lucide-react-native` standardized across all screens.
