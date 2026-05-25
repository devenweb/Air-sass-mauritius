# 06 Inventory & Pricing Logic Analysis

## 1. System Architecture Overview
The inventory and pricing system is a synchronized ecosystem where the **Admin App** serves as the authoritative Command Center (Write) and the **Web App** serves as the Consumption/Enforcement layer (Read).

### Core Data Flow
1.  **Definition**: Administrators define room-specific prices, stock levels, and "Stop-Sell" triggers in the `PriceManager`.
2.  **Persistence**: Data is normalized into the `service_pricing` table in Supabase, using a variant-scoping strategy (`variant_id`).
3.  **Discovery**: The Web App's Search Bar remains "open" for global discovery (Discovery-First).
4.  **Enforcement**: The Web App's Booking Wizard enforces inventory constraints once a specific service context is established (Constraint-Driven).

---

## 2. Admin Logic (The Command Center)
The `PriceManager.jsx` handles the complexity of seasonal pricing through several key mechanisms:

### Data Persistence (`handleSave`)
- **Normalized Table**: Instead of complex nested JSON, every price point is saved as a row in `service_pricing`.
- **Inheritance**: The system supports "Month-level" records and "Day-level" overrides. 
- **Inventory Controls**: 
    - **Stop-Sell**: A boolean flag (`is_stop_sell`) that takes absolute priority.
    - **Units/Stock**: A counter (`units_available`) that tracks physical inventory.

### Propagation Tools
- **Bulk Fill Tool**: Propagates prices and meal supplements from a master configuration across all 12 months in a single transaction.
- **Hydration Strategy**: The `mapPricingToGrid` function processes records in a specific order (ranges first, individual days last) to ensure that manual overrides correctly "hydrate" the UI grid.

---

## 3. Web App Logic (Consumption & Guardrails)
The Web App is engineered to be conversion-focused while preventing invalid bookings.

### Conditional Discovery Logic
- **Global Search (Homepage)**: To prevent friction, the Search Bar's `RangeDatePicker` skips stop-sell checks. This allows users to start their journey without being blocked by specific room unavailability they haven't seen yet.
- **Service Detail (Booking Wizard)**: Once a user selects a hotel or activity, the system identifies the `serviceId`. At this point, the `getStopDates` engine triggers:
    - It fetches all rows from `service_pricing` where `is_stop_sell = true`.
    - It parses these ISO strings into localized Date objects (using a timezone-safe `parseISO` strategy).
    - These dates are passed to the `DayPicker` as `disabled` modifiers.

### The Re-hydration Trigger
To ensure the UI reflects the latest inventory immediately upon loading a service:
- The `DayPicker` uses a dynamic `key` prop: `<DayPicker key={`calendar-${stopDates.length}`} ... />`.
- This forces React to unmount and re-mount the calendar whenever the availability data arrives, ensuring "Stop-Sell" icons and disabled states appear instantly without layout shifts.

---

## 4. Database Schema: `service_pricing`
The table acts as a unified seasonal grid.

| Column | Type | Description |
| :--- | :--- | :--- |
| `service_id` | UUID | Links to the Hotel/Activity. |
| `variant_id` | UUID | Links to specific Room Types/Variants (NULL = Global). |
| `date_from`/`date_to` | Date | The seasonal period or specific day. |
| `is_stop_sell` | Boolean | If true, the date is strictly unbookable. |
| `units_available` | Integer | Number of units in stock. |
| `price_*` | Decimal | Category-specific prices (Adult, Teen, Child, Infant). |

---

## 5. UI/UX: Boutique Calendar Standards
The calendar has been modernized to follow a premium boutique aesthetic:

- **Stability**: Calendars are now **High-Fidelity Centered Modals** with `backdrop-blur-sm`. This eliminates z-index conflicts and "flying popover" issues on mobile and dense desktop forms.
- **Visual Vocabulary**:
    - **Standard Days**: High-contrast black typography.
    - **Weekends**: Subtle `blue-50` background for better scannability.
    - **Stop-Sell Days**: Striking `bg-slate-900` with white text and a specialized icon, clearly indicating "No Availability".
    - **Interactive Pills**: Date selection uses smooth emerald/red gradients to signify check-in/out ranges.

---

## 6. Conclusion
The system successfully balances **Administrative Flexibility** (mass price updates) with **Frontend Reliability** (preventing invalid bookings). The latest refinement to scope inventory logic only to the booking form ensures that the user's initial discovery remains effortless while maintaining strict operational guardrails at the point of conversion.
