import React from 'react'
import DestinationListing from '@/components/DestinationListing'

export const metadata = {
    title: 'International Destinations | Travel Lounge',
    description: 'Explore our quality travel packages across Europe, Asia, and the Middle East.',
}

export default function InternationalDestinationPage() {
    return (
        <DestinationListing
            pageSlug="destination-international"
            title="Global Escapes"
            subtitle="From the historic cities of Europe to the vibrant cultures of Asia and the Middle East."
            heroImage="/assets/hero/flight_booking_hero_1773391370829.png"
            regions={['Europe', 'Asia', 'Middle East']}
            tag="INTERNATIONAL"
        />
    )
}
