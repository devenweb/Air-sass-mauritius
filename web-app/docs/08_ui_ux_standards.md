# UI/UX Standards & Guidelines
*Last updated: 2026-05-06*

---

## 1. Full-Page Immersive Layouts
> [!IMPORTANT]
> **Policy**: For all primary conversion forms and major user journeys (e.g., Booking Wizard, Tailor-Made inquiries), **always** use full-page immersive layouts instead of centered "popup" cards or modal-style boxes.

### Rationale
- **Zero Friction**: Prevents the "double scrollbar" issue where a form has its own vertical scroll inside a page.
- **Premium Feel**: Integrated full-page layouts feel like a custom boutique experience rather than a generic widget.
- **Mobile Excellence**: Full-page forms handle mobile viewport height more reliably and provide a better touch experience.
- **Aesthetics**: Allows for better use of the global header/footer and provides more "breathing room" for complex inputs like the Pricing Breakdown.

### Implementation Checklist
- [ ] Remove `rounded-[3rem]` card wrappers from the main `page.tsx` or client wrapper.
- [ ] Ensure the form container does **not** have `max-h-` or `overflow-y-auto`.
- [ ] Use `bg-white` for the entire page area if the form contains multiple card-styled sections.
- [ ] Ensure the secondary "Reservation" header is **not sticky** if it conflicts with the global sticky Navbar.
- [ ] Allow the page to flow naturally into the global Footer.

---

## 2. Calendar Standards
- **Today Highlight**: Always highlight the current date using the `today` prop with orange/red branding (`red-600`).
- **Stop Sales**: Dates with `is_stop_sell: true` must be rendered with a dark slate/black background and disabled state.
- **Weekends**: Highlight weekends with a soft blue tint to assist users in identifying Saturday-to-Saturday windows.

---

## 3. Family Occupancy Inputs (Added May 2026)
All booking forms that support hotel/room reservations must expose family occupancy fields consistently:
- **Required fields**: Adults, Teens (13–17), Children (2–12), Infants (0–2).
- **Visibility**: All four age-tier inputs must be visible by default — do not hide behind a toggle.
- **Layout**: Use a compact 2×2 grid on mobile, single-row on desktop.
- **Validation**: Minimum 1 adult per booking. Infants do not count toward room capacity limits.

---

## 4. Meal Plan Display Standards (Added May 2026)
When presenting meal plan options to guests:
- **Grid Layout**: Display all available meal plans in a single, balanced horizontal row on desktop viewports (use CSS Grid `grid-cols-N` where N = number of options).
- **Active Plans Only**: Only display meal plans that have a non-zero supplement price in `meal_plan_pricing`.
- **Deprecated**: "All Inclusive" is **removed** from all meal plan selections globally. Do not re-add.
- **Naming Convention**: Use consistent shorthand: BB (Bed & Breakfast), HB (Half Board), FB (Full Board).

---

## 5. Color & Branding Standards
- **Primary**: `red-600` — used for CTAs, active states, and brand accent.
- **Typography heading**: Outfit Black (900).
- **Typography body**: Inter / system-ui.
- **Border palette**: Slate-300 high-definition borders.
- **Dark accents**: `slate-900` for stop-sell / blocked states.
