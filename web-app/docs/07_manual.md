# Travel Lounge Admin Help Center

This section offers features and guides to help you keep your Travel Lounge ecosystem healthy and optimized.

---

## 1. Booking & Guest Management
- **How to manage new booking inquiries?**
  All inquiries are routed to the `Inquiries` dashboard and dispatched via email to the reservation team.
- **Where to find guest contact details?**
  Guest profiles are automatically created/updated in the `Customers` section upon booking.
- **How to view booking vouchers?**
  Go to `Reservations`, select a booking, and click "View" to see the detailed summary and print-ready voucher.

## 2. Pricing & Room Inventory
- **Where to set up seasonal pricing?**
  Use the **Price Manager** to define adult, teen, and child rates across different date ranges.
- **How to handle "Stop-Sell" (Blackout dates)?**
  In the Price Manager, select the specific dates and toggle the "Stop Sell" status to black out availability.
- **How to manage room-specific meal plans?**
  Navigate to **Room Manager** and update the "Meal Plan" field for individual room types to override service-level defaults.
- **How to sync bulk price updates?**
  Use the "Sync All Months" tool in the Price Manager to propagate a monthly base rate down to individual days.

## 3. Content & Marketing (CMS)
- **How to change the homepage Hero banners?**
  Navigate to **Hero Slides** to upload new images, update call-to-action text, and reorder slides.
- **Where to update social media links?**
  Visit the **Settings** page and use the 'General' tab to update TikTok, Instagram, and Facebook URLs.
- **How to toggle the Search Bar visibility?**
  In **Settings**, use the "Global Search Bar" toggle to show or hide the search interface on secondary pages.
- **How to manage promotional popups?**
  Use the **Popup Ads** section to choose between "Standard" (Text) and "Image Only" modes for flash sales.

## 4. Technical Health & Settings
- **How to update SMTP email credentials?**
  Go to **Settings > Email** to manage the server host, port, and authentication for transactional notifications.
- **Where to find system audit logs?**
  Visit the `Audit Logs` section in the admin dashboard to track sensitive operations and auth events.
- **How to regenerate TypeScript types?**
  (For Developers) Run `supabase gen types typescript --linked` to synchronize the frontend with database schema changes.

## 5. Troubleshooting & Data Integrity
- **Why is a service showing Rs 0 on the search card?**
  Ensure that at least one pricing record exists in the **Price Manager** for a date range that includes today or future dates. The system automatically pulls the lowest valid price (prioritizing Double occupancy for hotels). 
  *Tip: Check that the `date_to` for your pricing records hasn't expired.*
- **How to ensure prices update instantly on the website?**
  The web-app uses a cached fetch mechanism. If you update prices in the Admin, you may need to wait up to 60 seconds or perform a hard refresh (Ctrl+F5) on the public site to see the changes.
- **Why is the Promotional Popup not showing globally?**
  The popup activation depends on two factors:
  1. The "Popup Ads Active" toggle in **Settings**.
  2. At least one "Active" record in the **Popup Ads** section with valid start/end dates.

---

> [!TIP]
> **Need further assistance?**
> Feel free to contact the technical team at: `kevinadlib@gmail.com`

**Last updated:** May 12, 2026
<p align="center">
  <br />
  [← 06 Inventory Analysis](file:///c:/Users/deven/Desktop/Travel%20Lounge%202026/apps/web-app/docs/06_inventory_analysis.md) &nbsp;&nbsp; | &nbsp;&nbsp; [08 UI/UX Standards →](file:///c:/Users/deven/Desktop/Travel%20Lounge%202026/apps/web-app/docs/08_ui_ux_standards.md)
</p>
