# Mobile Feature Gap Analysis & Roadmap
**Project:** Royal Travel Agency 2026  
**Status:** Audit Complete  
**Objective:** Achieve full functional and aesthetic parity between Web and Mobile platforms.

---

## 1. High-Level Feature Gaps
These are entire modules or interactive systems present in the `web-app` but missing from the `mobile-app`.

| Feature | Web Status | Mobile Status | Gap / Impact |
| :--- | :--- | :--- | :--- |
| **AI Concierge** | Full high-fidelity integration (`AIConcierge.tsx`) | **MISSING** | High impact on premium "elite" branding and customer support. |
| **Interactive Map** | Dynamic SVG map for destination discovery | **MISSING** | Reduced interactive engagement for localized Mauritius discovery. |
| **Flights Module** | Custom themed page with Hero, Assistance, and SEO content | **PLAIN WEBVIEW** | Breaks the native premium feel; lacks expert assistance conversion hooks. |
| **Local Deals** | Dedicated `/local-deals` module with regional pricing | **BASIC FILTER** | No specialized landing experience for Mauritius residents. |
| **Booking Addons** | Complex multi-step wizard with extras (Transfers, Spa) | **MISSING** | Lost revenue opportunity for booking upsells (Sim cards, Airport pickups). |

---

## 2. UI/UX: Icons, Labels & Specifications
A detailed audit of micro-elements and branding hooks that ensure a consistent "Boutique Elite" feel.

### 2.1 Service Listing Parity (`ServiceCard`)
The mobile card is currently a "simplified" version. To reach parity, the following must be added:
- **Missing Icons**: 
    - **Activity Type**: `Waves` (Sea), `Palmtree` (Land), `Plane` (Air) badges.
    - **Quick Amenities**: Listing-level icons for `WiFi`, `Pool`, `Beach`, `Spa` (3-4 icons max).
    - **Duration**: `Clock` icon next to duration text.
- **Missing Labels**:
    - **Dynamic Strings**: Integration with `generalConfig.ui_labels` for "As From", "Limited Time", and "Special Offer".
    - **Meal Plans**: Color-coded badges (e.g., "Full Board", "All-Inclusive") using the `emerald-50` web style.
- **Missing Specs**:
    - **Short Description**: Snippet text with `line-clamp-2` for better context before clicking.
    - **Star Ratings**: Numeric and star-based rating visibility on the listing card.

### 2.2 Interactive Components
- **Advanced Filters**: Mobile lacks `Sort By` (Popularity, Rating, Price High-Low) and specific rating thresholds (e.g., "4+ Stars").
- **Search Bar**: Mobile search segments should be more descriptive, matching the web's "Where to", "When", and "Guests" density.
- **Partner Slider**: Mobile uses local `require()` assets; should transition to dynamic CMS assets to match web updates.

---

## 3. Technical Specifications Gap
- **Pricing Logic**: While `lead price` logic is synced, the `BookingModal` does not yet handle **Occupancy-Based Grid Pricing** for addons, only for the main room/service.
- **SEO & Metadata**: Mobile lacks the "Executive SEO" data blocks (JSON-LD) which could be used for advanced sharing (OpenGraph) when users share service links from the app.
- **Email Parity**: The mobile booking notification calls the web API, but it needs to ensure all `lead_data` fields (like `roomPreference`) match the web-app's expected template keys exactly.

---

## 4. Implementation Roadmap (Priority Order)

### Phase 1: Native Branding & Consistency (Short Term)
1.  **Sync UI Labels**: Move mobile hardcoded labels to the `SettingsContext` (CMS-driven).
2.  **ServiceCard Refinement**: Add Star Ratings, Meal Plan badges, and Activity icons.
3.  **Hero Enhancements**: Add "As From" badges and promotional overlays to the mobile Hero Carousel.

### Phase 2: Functional Parity (Mid Term)
1.  **Booking Addons**: Implement the "Extras" selection step in `BookingModal.tsx`.
2.  **Flights UI Wrapper**: Build a native Hero/Assistance wrapper around the GOL IBE WebView.
3.  **Local Deals Landing**: Create a dedicated screen for localized Mauritian offers.

### Phase 3: "Wow" Features (Long Term)
1.  **AI Concierge**: Port the `AIConcierge.tsx` logic to a native React Native component.
2.  **Mauritius Interactive Map**: Develop a native SVG-based map component for regional discovery.

---

> [!IMPORTANT]
> **Conclusion:** The mobile app is technically solid but currently feels like a "lite" version of the web platform. Focusing on **Icons**, **Addons**, and **Custom Wrappers** (for Flights) will bridge the gap to a true "Elite" experience.
