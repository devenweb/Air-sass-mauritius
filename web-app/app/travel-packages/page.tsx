import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const metadata: Metadata = {
    title: '🌍 Exclusive Travel Packages Abroad | Royal Travel Agency',
    description: 'Explore the world with our curated international travel packages. From Dubai to Turkey, experience seamless luxury and adventure.',
    alternates: {
        canonical: 'https://royaltravel.mu/travel-packages',
    },
    openGraph: {
        title: 'Boutique Travel Abroad Packages | Royal Travel Agency',
        description: 'Luxury international stays and curated global experiences packed into perfect travel packages.',
        url: 'https://royaltravel.mu/travel-packages',
        type: 'website',
    }
}

export default function TravelPackagesPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://royaltravel.mu'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Travel Abroad',
                item: 'https://royaltravel.mu/travel-abroad'
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: 'Travel Packages',
                item: 'https://royaltravel.mu/travel-packages'
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
                title="International Travel Packages"
                subtitle="World-class journeys curated for the discerning traveler. Discover iconic destinations with all-inclusive ease."
                heroImage="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80"
                serviceTypes={['package', 'packages', 'tour', 'activity']} // Inclusive of types that might be used for abroad packages
                categorySlug="travel-packages"
                tag="ABROAD"
                searchPlaceholder="Search destinations like Dubai, Turkey, Singapore..."
                showOccupancyFilter={true}
            />
        </>
    )
}
