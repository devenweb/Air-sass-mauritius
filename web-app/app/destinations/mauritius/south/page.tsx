import React from 'react'
import DestinationListing from '@/components/DestinationListing'

export const metadata = {
    title: 'South Coast Mauritius - Authentic & Scenic | Travel Lounge',
    description: 'Explore the rugged cliffs and authentic scenic beauty of the South of Mauritius.',
}

export default function MauritiusSouthPage() {
    return (
        <DestinationListing
            title="South Coast"
            subtitle="Rugged landscapes, basalt cliffs, and the authentic soul of Mauritius."
            heroImage="/assets/hero/day_packages_hero_1773391515388.png"
            regions={['South', 'South Coast']}
            tag="MAURITIUS SOUTH"
        />
    )
}
