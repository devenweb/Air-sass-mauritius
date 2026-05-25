# 01 Overview & Ecosystem

## Project Mission
The **Travel Lounge Admin Portal** is the strategic hub for service providers and administrators. It provides real-time control over the entire 11/10 Elite travel ecosystem, enabling the management of inventories, bookings, and global site settings.

---

## Core Functional Capabilities
- **Strategic Dashboard**: Real-time sales analytics and pending action items.
- **Dynamic CMS**: Full control over Hero sections, Category Cards, and Destinations across all platforms.
- **Service Management**: Multi-image gallery support, narrative metadata, and pricing synchronization.
- **Global Branding**: Centralized control of logos, social sharing metadata, and platform-specific settings.
- **Advanced Pricing Engine**: Specialized monthly/yearly calendar grid for complex service pricing.
- **Room & Configuration Manager**: Dedicated interface for managing room-level occupancy limits (Adult/Teen/Child/Infant) independently of pricing.
- **Reporting Engine**: Advanced data visualization for customer behavior and booking trends.

---

## Technical Stack
- **Framework**: Vite + React 19.
- **UI Design System**: Ant Design (Ant-D) + Tailwind CSS.
- **Branding Architecture**: Standardized with high-definition Slate-300 borders and Outfit-900 typography for a professional executive look.
- **Asset Resolution**: Dynamic resolver via `import.meta.glob` supporting centralized `/assets/` synchronization.
- **Backend**: Supabase (PostgreSQL, Real-time, Auth).

---

## Global Alignment
This portal serves as the single source of truth for:
- [Web Application](../web-app/README.md)
- [Mobile Application](../mobile-app/README.md)
