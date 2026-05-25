import React from 'react'
import DestinationListing from '@/components/DestinationListing'

export const metadata = {
    title: 'Mauritius - Discover the Island | Travel Lounge',
    description: 'Explore our curated list of hotels, activities, and packages in Mauritius.',
    alternates: {
        canonical: 'https://travellounge.mu/destinations/mauritius',
    }
}

export default function MauritiusDestinationPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'AdministrativeArea',
        name: 'Mauritius',
        description: 'Tropical island nation in the Indian Ocean known for its beaches, lagoons and reefs.',
        image: '/assets/hero/mauritius_destination_hero_1773391482617.png',
        url: 'https://travellounge.mu/destinations/mauritius'
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <DestinationListing
                pageSlug="destination-mauritius"
                title="Mauritius Island"
                subtitle="Explore the breathtaking beauty of our tropical island. From pristine beaches to lush interior landscapes."
                heroImage="/assets/hero/mauritius_destination_hero_1773391482617.png"
                regions={['North', 'East', 'South', 'West', 'Mauritius', 'North Coast', 'East Coast', 'South Coast', 'West Coast']}
                tag="" 
            />
        </>
    )
}
