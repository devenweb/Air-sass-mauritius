# 08 Price Manager — Feature Documentation
*Added: May 2026*

## Overview
The **Price Manager** (`src/pages/PriceManager.jsx`) is the most complex component in the Admin Portal. It provides a high-density seasonal pricing grid for managing room-level pricing across all occupancy tiers and meal plan supplements.

---

## How It Works

### 1. Loading Data
On mount, the Price Manager:
1. Fetches all `room_types` for the selected service.
2. Fetches all `service_pricing` rows for the selected service + variant.
3. Calls `mapPricingToGrid()` to hydrate the grid from database rows.

### 2. The Pricing Grid
The grid displays 12 months × N days. Each cell holds:
- **Adult price** (base rate)
- **Occupancy pricing**: Single / Double / Triple / Quad (stored as `occupancy_pricing` JSONB)
- **Meal plan supplements**: BB / HB / FB (stored as `meal_plan_pricing` JSONB)
- **Stop-Sell toggle**: Boolean flag (`is_stop_sell`) — blocks the date across all guest surfaces instantly.
- **Units available**: Stock counter (`units_available`).

### 3. Saving (`handleSave`)
Each grid cell is saved as a **row** in `service_pricing` — no nested JSONB for pricing (strict relational):
- `service_id` — the hotel/activity
- `variant_id` — the specific room type (NULL = applies to all)
- `date_from` / `date_to` — the date range or individual day
- `price` — Adult base rate
- `occupancy_pricing` — JSONB `{single, double, triple, quad}`
- `meal_plan_pricing` — JSONB `{bb, hb, fb}`
- `is_stop_sell` — Boolean
- `units_available` — Integer

> [!IMPORTANT]
> The `variant` column does NOT exist in `service_pricing`. Always use `variant_id` (UUID). Passing a `variant` string will cause a schema error on save.

### 4. Bulk Fill Tool
The **Bulk Fill** button propagates a master month's configuration across all 12 months in a single transaction. Useful for setting a baseline price before applying seasonal overrides.

### 5. Deploy Button
The **Deploy** button:
1. Validates that the grid contains at least one row with data.
2. Upserts all rows to `service_pricing` via Supabase.
3. Returns a success/error toast.

> [!WARNING]
> If the grid appears empty (no rows), clicking Deploy will silently skip — it does NOT clear existing pricing. Ensure data is entered before deploying.

---

## Occupancy Tiers
| Tier | Applies to |
|---|---|
| Adult | Primary guest (18+) |
| Teen | 13–17 years |
| Child | 2–12 years |
| Infant | 0–2 years |

Occupancy pricing (Single/Double/Triple/Quad) refers to the number of adults sharing a room — not age tiers.

---

## Meal Plans
| Code | Name |
|---|---|
| BB | Bed & Breakfast |
| HB | Half Board (breakfast + dinner) |
| FB | Full Board (all meals) |

> [!NOTE]
> "All Inclusive" (AI) has been **removed** from all meal plan options globally as of May 2026.

---

## Known Issues & Fixes
- **May 2026 Fix**: Removed non-existent `variant` column from INSERT — now uses `variant_id` only.
- **May 2026 Fix**: Added validation guard to prevent deploying an empty grid.
- **SQL Reference**: See `supabase/add_service_fee.sql` and `supabase/fix_room_types.sql` for related schema fixes.
