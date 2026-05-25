import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'
import { resolveImageUrl } from '@/lib/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
    title: '🚢 Luxury Cruise Packages & Sea Voyages 2026 | Travel Lounge',
    description: 'Set sail with our premium cruise holidays. Discover breathtaking sea voyages across the Indian Ocean with exclusive all-inclusive packages.',
    alternates: {
        canonical: 'https://travellounge.mu/cruises',
    },
    openGraph: {
        title: 'Premium Cruise Holidays 2026 | Travel Lounge',
        description: 'Breathtaking sea voyages and exclusive cruise packages.',
        url: 'https://travellounge.mu/cruises',
        type: 'website',
    }
}

export default function CruisesPage() {
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
                name: 'Cruises',
                item: 'https://travellounge.mu/cruises'
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
                title="Cruise Holidays"
                subtitle="Set sail for amazing destinations with our trusted cruise partners."
                heroImage="/assets/heroes/hero-cruises.png"
                pageSlug="cruises"
                serviceTypes={['cruise']}
                tag="CRUISE"
                searchPlaceholder="Search cruise packages, ships, destinations..."
                defaultSearchCategory="cruises"
            />
        </>
    )
}
