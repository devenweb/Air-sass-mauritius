/*
// LEGACY SLUG-BASED LOGIC
'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import PackageDetail from '@/components/PackageDetail'

export default function PackageDetailPage() {
    const params = useParams()

    const mockData = {
        title: "Catamaran Cruise to Île aux Cerfs",
        subtitle: "Sun, Sea & Sand",
        description: "Enjoy a full day catamaran cruise along the east coast. Swim in the lagoon, enjoy a BBQ lunch on board, and relax on the famous beaches of Île aux Cerfs.",
        price: "Rs 1,800",
        images: ["/hero-cruise.png", "/hero-cruise.png", "/hero-cruise.png"],
        highlights: [
            "BBQ Lunch (Chicken/Fish/Lobster)",
            "Unlimited drinks",
            "Snorkeling stop",
            "Visit to GRSE Waterfall"
        ],
        itinerary: [
            { day: "09:00", title: "Departure", desc: "Set sail from Trou d'Eau Douce." },
            { day: "11:00", title: "Waterfall", desc: "Visit the Grand River South East Waterfall." },
            { day: "12:30", title: "Lunch", desc: "BBQ lunch served on board." },
            { day: "14:00", title: "Île aux Cerfs", desc: "Free time on the island." }
        ],
        meta: {
            duration: "Full Day",
            location: "East Coast",
            date: "Daily"
        }
    }

    return <PackageDetail {...mockData} />
}
*/

/*
export default function LegacyPackageDetailPage() {
    return null // Content is now handled by [id]/page.tsx
}
*/
