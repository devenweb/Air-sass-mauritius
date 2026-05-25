# 03 Database Schema (PostgreSQL)

> [!NOTE]
> The canonical Database Schema is maintained in the **web-app** repository to avoid duplication.
> Please refer to: **[web-app/docs/03_database.md](../../web-app/docs/03_database.md)**

---

## Admin-App Specific Notes

### RLS & Access
The Admin Portal connects using an authenticated session verified by `is_admin_v2()`. Key enforcement points:
- All write operations (INSERT/UPDATE/DELETE on `services`, `service_categories`, `service_pricing`) require an admin session.
- Staff members must have their `user_id` linked in `public.admins` — see [`07_rls_diagnosis.md`](./07_rls_diagnosis.md) for the fix script.

### Price Manager — `service_pricing` Table
The Admin's **Price Manager** (`PriceManager.jsx`) writes directly to `service_pricing`:
- Each month/day record is a row — no nested JSONB for pricing (strict relational).
- `variant_id` scopes pricing to a specific `room_type`.
- `occupancy_pricing` JSONB holds Single/Double/Triple/Quad rates.
- `meal_plan_pricing` JSONB holds board basis supplement amounts.
- Bulk propagation inserts all 12-month rows in a single transaction.

### Supabase SQL Files
Located in `supabase/`:
| File | Purpose |
|---|---|
| `infrastructure.sql` | Core schema — tables, indexes, constraints |
| `policies.sql` | All RLS policies |
| `seed.sql` | Reference seed data |
| `add_service_fee.sql` | Service fee column migration (applied May 2026) |
| `fix_room_types.sql` | Room type capacity fix (applied May 2026) |
