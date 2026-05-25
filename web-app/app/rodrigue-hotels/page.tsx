import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
    title: '🏝️ Best Hotels in Rodrigues: Authentic Island Stays & Beachfront Guesthouses',
    description: 'Experience genuine Rodriguan hospitality. Discover the best hotels, charming guesthouses and beachfront resorts in Rodrigues Island at best local rates.',
    alternates: {
        canonical: 'https://travellounge.mu/rodrigue-hotels',
    },
    openGraph: {
        title: 'Authentic Rodrigues Island Stays | Travel Lounge',
        description: 'Peace, serenity, and local charm. Curated selection of the best places to stay in Rodrigues.',
        url: 'https://travellounge.mu/rodrigue-hotels',
        type: 'website',
    }
}

export default function RodriguesHotelsPage() {
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
                name: 'Rodrigues Hotels',
                item: 'https://travellounge.mu/rodrigue-hotels'
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
                pageSlug="rodrigue-hotels"
                title="Island Living, Rodrigues"
                subtitle="Experience genuine hospitality in our curated selection of Rodrigues stays. Peace, serenity, and local charm."
                heroImage="/assets/hero/rodrigues_hotels_hero_1773391499243.png"
                serviceTypes={['hotel']}
                includeRegions={['Rodrigues']}
                tag="RODRIGUES"
                searchPlaceholder="Search Rodrigues hotels..."
                showDateFilter={true}
                showOccupancyFilter={true}
            />
        </>
    )
}
