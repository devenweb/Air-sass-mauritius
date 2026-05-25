import React from 'react'
import DestinationListing from '@/components/DestinationListing'

export const metadata = {
    title: 'West Coast Mauritius - Sunsets & Adventure | Travel Lounge',
    description: 'Adventure and the best sunsets in Mauritius await you on the West Coast.',
}

export default function MauritiusWestPage() {
    return (
        <DestinationListing
            title="West Coast"
            subtitle="Dolphin watching, surfing at Le Morne, and the most spectacular sunsets on the island."
            heroImage="/assets/hero/group_tours_hero_1773391421071.png"
            regions={['West', 'West Coast']}
            tag="MAURITIUS WEST"
        />
    )
}
