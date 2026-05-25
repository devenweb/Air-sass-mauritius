# 01 Overview & Ecosystem

## Project Mission
The **Travel Lounge Mobile App** is a high-engagement concierge interface. It allows users to browse luxury services, track itineraries, and connect with 1-tap support. The app aims for an "Elite 11/10" standard of visual excellence and user experience.

---

## Core Functional Capabilities
- **Universal Discovery**: Seamlessly search and book Hotels, Flights (GOL IBE), and Activities.
- **Dynamic Itineraries**: 100% real-time data synchronization with the Supabase backend.
- **Insights Module**: Integrated travel trends and news section (`editorial_posts`).
- **Interactive Support**: 1-tap WhatsApp and Email concierge paths on all service pages.
- **Global Branding**: Visual parity with web and admin apps through a shared asset directory.

---

## Technical Stack
- **Framework**: Expo SDK 52 (React Native).
- **Styling**: Nativewind (Tailwind CSS for Native).
- **Core UI**: React Native Paper + Lucide Icons.
- **Image Engine**: `expo-image` with server-side resizing via Supabase parameters.
- **Backend/Auth**: Supabase (PostgreSQL, Real-time, Auth).

---

## Global Alignment
This app consumes branding and content managed via:
- [Admin Portal](../admin-app/README.md)
- [Web Application](../web-app/README.md)
