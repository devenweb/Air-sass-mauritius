'use client'

import React from 'react'
import PackageDetail from '@/components/PackageDetail'

export default function RodriguesDetailPage() {
    // URL params are handled by the page's route but not used in the mock view logic

    const mockData = {
        title: "Tekoma Boutik Hotel",
        subtitle: "Barefoot Comfort in Rodrigues",
        description: "Nestled on the beautiful Anse Ally beach, Tekoma offers an intimate and special experience. Discover the authentic charm of Rodrigues in a setting of understated comfort.",
        price: "Rs 18,000",
        images: ["/assets/placeholders/hero-hotel.png", "/assets/placeholders/hero-hotel.png", "/assets/placeholders/hero-hotel.png"],
        highlights: [
            "Direct beach access",
            "Private terrace with sea view",
            "Traditional Rodriguan cuisine",
            "Wellness centre"
        ],
        itinerary: [
            { day: "Day 1", title: "Arrival", description: "Transfer from Plaine Corail Airport. Welcome dinner." },
            { day: "Day 2", title: "Island Discovery", description: "Optional tour to Port Mathurin market and Caverne Patate." },
            { day: "Day 3", title: "Leisure", description: "Relax by the pool or hike to Trou d'Argent." }
        ],
        meta: {
            duration: "3 Nights",
            location: "Anse Ally",
            date: "Flexible"
        }
    }

    return <PackageDetail {...mockData} />
}
