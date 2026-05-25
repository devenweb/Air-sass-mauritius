import React from 'react'
import DestinationListing from '@/components/DestinationListing'

export const metadata = {
    title: 'Rodrigues - The Authentic Escape | Royal Travel Agency',
    description: 'Discover the hidden gem of the Indian Ocean. Authenticity, nature, and tranquility.',
}

export default function RodriguesDestinationPage() {
    return (
        <DestinationListing
            pageSlug="rodrigues"
            title="Rodrigues Island"
            subtitle="The authentic alternative island escape. Discover untouched nature and the unique Rodriguan soul."
            heroImage="/assets/hero/rodrigues_hotels_hero_1773391499243.png"
            regions={['Rodrigues']}
            tag=""
            defaultSearchCategory="rodrigues"
            categorySlug="rodrigues"
        />
    )
}
