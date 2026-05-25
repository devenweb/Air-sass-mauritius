import React from 'react'
import DestinationListing from '@/components/DestinationListing'

export const metadata = {
    title: 'North Coast Mauritius - Vibrant & Beautiful | Travel Lounge',
    description: 'Explore hotels and activities in the North of Mauritius, home to Grand Baie.',
}

export default function MauritiusNorthPage() {
    return (
        <DestinationListing
            title="North Coast"
            subtitle="Vibrant nightlife, pristine beaches, and great shopping in Grand Baie and beyond."
            heroImage="/assets/hero/mauritius_destination_hero_1773391482617.png"
            regions={['North', 'North Coast']}
            tag="MAURITIUS NORTH"
        />
    )
}
