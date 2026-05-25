# 03 Database Schema (PostgreSQL)

> [!NOTE]
> The canonical Database Schema is maintained in the **web-app** repository to avoid duplication.
> Please refer to: **[web-app/docs/03_database.md](../../web-app/docs/03_database.md)**

---

## Mobile App — Supabase Usage Notes

The Mobile App is a **read-heavy consumer** of the shared Supabase backend.

### Key Tables Consumed
| Table | Usage |
|---|---|
| `services` | Listing pages, detail pages, search |
| `service_pricing` | Room pricing display in booking modal |
| `room_types` | Room type cards with meal plan display |
| `cms_content` | Hero carousel content, CMS sections |
| `site_settings` | App branding, WhatsApp number, contact info |
| `bookings` | Customer booking history (authenticated) |
| `editorial_posts` | Insights/News section |
| `popup_ads` | Promotional modals on launch |

### RPCs Used
- **`get_or_create_customer_v1`** — Upserts a customer profile before booking.
- **`create_booking_v1`** — Atomic booking creation with item insertion.

### Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_API_URL=https://<web-app>.vercel.app
```

### Auth Pattern
- Anonymous users can browse and submit bookings.
- Authenticated users see their personal booking history.
- No admin-level operations are performed from the mobile app.
