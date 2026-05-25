import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const metadata: Metadata = {
    title: '🌍 Guided World Tours & Immersive Group Adventures | Travel Lounge',
    description: 'Expertly led group tours across Africa, Asia, and Europe. Join small groups for the journey of a lifetime. Hand-picked itineraries & expert guides.',
    alternates: {
        canonical: 'https://travellounge.mu/tours',
    },
    openGraph: {
        title: 'Global Adventures & Guided Tours | Travel Lounge',
        description: 'Immersive group travel experiences led by expert guides.',
        url: 'https://travellounge.mu/tours',
        type: 'website',
    }
}

export default function ToursPage() {
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
                name: 'Tours',
                item: 'https://travellounge.mu/tours'
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
                pageSlug="guided-group-tours"
                title="Global Adventures"
                subtitle="Explore the world with like-minded travelers on our expertly guided group tours."
                heroImage="/assets/placeholders/hero-adventure.png"
                serviceTypes={['tour']}
                tag="TOUR"
                searchPlaceholder="Search tours, regions, destinations..."
                defaultSearchCategory="group-tours"
            />
        </>
    )
}
