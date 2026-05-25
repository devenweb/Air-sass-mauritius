# 03 Database Schema (PostgreSQL)

## Core Relational Tables
Royal Travel Agency 2026 utilizes a high-integrity relational schema optimized for multi-occupancy travel services and daily pricing grids.

### 1. `services`
The authoritative catalog for all travel offerings.
- **Key Columns**: `id`, `name`, `description`, `service_type`, `activity_type`, `location`, `region`.
- **Media**: `image_url`, `banner_url`, `thumbnail_url`, `gallery_images` (TEXT[]).
- **Metadata**: `itinerary`, `highlights`, `included`, `not_included`, `meal_plans` (all JSONB).
- **Flags**: `is_active`, `is_seasonal_deal` (Promotional Deal), `is_coming_soon`, `featured`.
- **Policy**: `cancellation_policy`, `terms_and_conditions`.
- **Capacity**: `max_adults`, `max_children`, `child_age_limit` (defaults to 12).

### 2. `room_types` (Variants)
Defines specific configurations or room categories for a parent service.
- **Key Columns**: `id`, `service_id`, `name`, `description`, `image_url`.
- **Occupancy Constraints**: `max_adults`, `max_teens`, `max_children`, `max_infants`, `max_occupancy`.
- **Rules**: `min_stay_days`, `meal_plan`, `service_fee` (variant-level override).

### 3. `service_pricing` (The Pricing Grid)
The central engine for seasonal overrides, daily availability, and tiered pricing.
- **Key Columns**: `service_id`, `variant_id` (Room Type), `date_from`, `date_to`, `price` (Adult Selling).
- **Tiered Pricing**: `price_teen`, `price_child`, `price_infant`.
- **Net Pricing**: `net_price`, `net_price_teen`, `net_price_child`, `net_price_infant`.
- **Occupancy Mapping**: `occupancy_pricing` (JSONB) for mapping rates to specific counts (e.g., {"1": {"price": 5000}, "2": {"price": 8500}}).
- **Availability**: `units_available`, `is_stop_sell`.
- **Supplements**: `meal_plan_id` for board basis overrides.

### 4. `bookings`
Transactional tracking of reservations with auto-calculating totals.
- **Key Columns**: `customer_id`, `service_name`, `service_type`, `check_in_date`, `check_out_date`.
- **Calculations**: `amount`, `tax_amount`, `total_price` (Generated: `amount + tax_amount`).
- **Status**: `status` (Pending, Confirmed, Cancelled), `payment_status`.
- **Pax Tracking**: `pax_adults`, `pax_teens`, `pax_children`, `pax_infants`.

### 5. `site_settings`
Global configuration hub for administrative control.
- **Structure**: `key` (PK), `value` (JSONB), `category`, `description`.
- **Usage**: Toggles for `popupAdsActive`, `searchBarVisible`, SMTP credentials, and social media URLs.

### 6. `popup_ads`
Promotional engine for high-conversion flash sales.
- **Key Columns**: `title`, `content`, `media_url`, `media_type` (image/video/none).
- **Controls**: `is_active`, `display_frequency`, `popup_type` (standard/image_only), `start_at`, `end_at`.

---

## Security & Access (RLS)
Row Level Security is strictly enforced via Supabase:
- **Public**: `SELECT` access to `services`, `service_pricing`, `categories`, and `cms_pages`.
- **Authenticated (Admin)**: Full `ALL` access to manage the ecosystem.
- **Authenticated (User)**: `SELECT`/`UPDATE` access restricted to their own `profiles` and `bookings`.

---

## Authoritative Logic (RPC)
- **`calculate_lead_price`**: Database-side logic for extracting the lowest available price for a service.
- **`create_booking_v1`**: Atomically creates booking records and handles customer unification.
- **`get_table_columns`**: Diagnostic helper for schema discovery.
