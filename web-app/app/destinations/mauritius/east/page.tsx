import React from 'react'
import DestinationListing from '@/components/DestinationListing'

export const metadata = {
    title: 'East Coast Mauritius - Wild & Luxurious | Travel Lounge',
    description: 'Discover the wild beauty and quality resorts of the East Coast of Mauritius.',
}

export default function MauritiusEastPage() {
    return (
        <DestinationListing
            title="East Coast"
            subtitle="Home to the famous Ile aux Cerfs and some of the island's most special resorts."
            heroImage="/assets/hero/tailormade_travel_hero_1773391405705.png"
            regions={['East', 'East Coast']}
            tag="MAURITIUS EAST"
        />
    )
}
