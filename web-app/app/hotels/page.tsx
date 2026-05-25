import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
    title: '🇲🇺 Best Luxury Hotels & Beachfront Resorts in Mauritius | Travel Lounge',
    description: 'Discover the top luxury hotels in Mauritius. Book exclusive deals at world-class resorts with local island experts. Low Price Guarantee & Free Concierge.',
    alternates: {
        canonical: 'https://travellounge.mu/hotels',
    },
    openGraph: {
        title: 'Luxury Mauritius Hotels & Resorts | Travel Lounge',
        description: 'Discover world-class hospitality and stunning beachfront resorts in Mauritius.',
        url: 'https://travellounge.mu/hotels',
        type: 'website',
    }
}

export default function HotelsPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://travellounge.mu'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Hotels',
                item: 'https://travellounge.mu/hotels'
            }
        ]
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ServiceListing
                title="Exquisite Stays"
                subtitle="Discover excellent hospitality in the most stunning locations across Mauritius and beyond."
                heroImage="/assets/heroes/hero-hotels.png"
                serviceTypes={['hotel']}
                excludeRegions={['Rodrigues']}
                tag="HOTEL"
                searchPlaceholder="Search hotels, resorts, locations..."
                showDateFilter={true}
                showCheckOutFilter={true}
                showOccupancyFilter={true}
                showRoomTypeFilter={true}
                defaultSearchCategory="hotels"
                pageSlug="hotels"
            />
        </>
    )
}
