import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const metadata: Metadata = {
    title: '🌴 Mauritius Travel Packages: All-Inclusive Hotel & Activity Deals',
    description: 'Experience Mauritius with our curated travel packages. All-inclusive hotel stays, transfers, and curated excursions at the best fixed rates.',
    alternates: {
        canonical: 'https://travellounge.mu/packages',
    },
    openGraph: {
        title: 'Boutique Mauritius Travel Packages | Travel Lounge',
        description: 'Luxury hotel stays and curated island experiences packed into perfect travel packages.',
        url: 'https://travellounge.mu/packages',
        type: 'website',
    }
}

export default function PackagesPage() {
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
                name: 'Packages',
                item: 'https://travellounge.mu/packages'
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
                title="Boutique Travel Packages"
                subtitle="All-inclusive island experiences curated for value and luxury. Hotel stays, gourmet dining, and expert-led tours in one package."
                heroImage="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80"
                serviceTypes={['package', 'packages']}
                categorySlug="packages"
                tag="PACKAGE"
                searchPlaceholder="Search travel packages, hotel bundles..."
                showOccupancyFilter={true}
            />
        </>
    )
}
