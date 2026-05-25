# Brand Identity & Contact Standardization

This document outlines the standardized brand assets and contact information for the Royal Travel Agency 2026 ecosystem.

---

## 1. Corporate Contact Information
As of **May 12, 2026**, the corporate contact details have been standardized across all platforms:

- **Primary WhatsApp/Mobile:** `+230 5509 7702`
- **Secondary WhatsApp:** `+230 5940 7711`
- **Office Direct Line:** `+230 212 4070`
- **Email Support:** `reservation@travellounge.mu`

## 2. Dynamic Branding Logic
The ecosystem supports multi-brand identity injection based on the service category:

### Standard Brand (Red Bird)
- **Context:** Hotels, Flights, Packages, Cruises, Tours.
- **Logo:** `https://travellounge.mu/assets/logo-red-bird.png`
- **Primary Color:** `#DC2626` (Red)
- **Support Email:** `reservation@travellounge.mu`

### Leisure & Tours Brand (Teal)
- **Context:** Local Deals, Sea Activities, Land Activities.
- **Logo:** `https://travellounge.mu/assets/logo-leisure.png`
- **Primary Color:** `#0F172A` (Navy/Slate) with Teal accents.
- **Support Email:** `inbound@travellounge.mu`

## 3. Email Infrastructure Standards
- **Footer Contact:** All transactional emails must include the standardized `+230 5509 7702` contact number.
- **Template System:** Managed via the `email_templates` table in Supabase.
- **Placeholder Safety:** Dynamic introductory text with HTML tags (e.g., `<strong>`) must use the `{{raw:intro_text}}` placeholder to prevent escaping.

## 4. Platform-Specific Implementation
- **Web-App:** Uses the `useBrand` hook to dynamically toggle assets based on URL parameters or service category.
- **Mobile-App:** Optimized for the standardized WhatsApp concierge number.
- **AI Concierge:** Hardcoded to trigger bookings via the `5509 7702` channel.

---
**Last Updated:** May 12, 2026
**Approved by:** Corporate Identity Team
