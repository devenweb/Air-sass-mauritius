import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
    title: '🏝️ Best Local Hotel Deals & Resident Offers Mauritius | Royal Travel Agency',
    description: 'Exclusive hotel deals and island experiences for Mauritius residents. Discover special staycation rates, day packages and local activity offers.',
    alternates: {
        canonical: 'https://royaltravel.mu/local-deals',
    },
    openGraph: {
        title: 'Boutique Local Resident Deals Mauritius | Royal Travel Agency',
        description: 'Your island, rediscovered. Special rates on the finest luxury resorts and activities for locals.',
        url: 'https://royaltravel.mu/local-deals',
        type: 'website',
    }
}

export default function LocalDealsPage() {
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
                name: 'Local Deals',
                item: 'https://royaltravel.mu/local-deals'
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
                pageSlug="local-deals"
                title="Local Island Escapes"
                subtitle="Island escapes, rediscovered. Discover the best resident rates for luxury hotels and activities."
                heroImage="/assets/hero/local_deals_hero_1773391387665.png"
                tag="LOCAL DEAL"
                searchPlaceholder="Search local deals, resorts, adventures..."
                serviceTypes={['hotel', 'day_package', 'activity', 'land_activity', 'sea_activity']}
                defaultSearchCategory="hotels"
                showDateFilter={true}
                showOccupancyFilter={true}
            />
        </>
    )
}
