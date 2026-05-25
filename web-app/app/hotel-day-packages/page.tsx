import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
    title: '🏝️ Best Resort Day Passes in Mauritius: All-Inclusive Day Packages',
    description: 'Indulge in the finest resort facilities without the overnight stay. Book exclusive hotel day packages and resort day passes online at best rates.',
    alternates: {
        canonical: 'https://travellounge.mu/hotel-day-packages',
    },
    openGraph: {
        title: 'Premium Mauritius Resort Day Passes | Royal Travel Agency',
        description: 'Experience luxury resorts for a day. All-inclusive lunch, pool access, and activities.',
        url: 'https://travellounge.mu/hotel-day-packages',
        type: 'website',
    }
}

export default function HotelDayPackagesPage() {
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
                name: 'Hotel Day Packages',
                item: 'https://travellounge.mu/hotel-day-packages'
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
                pageSlug="hotel-day-packages"
                title="Resort Day Passes"
                subtitle="Indulge in the finest resort facilities without the overnight stay."
                heroImage="/assets/hero/day_packages_hero_1773391515388.png"
                tag="HOTEL DAY PASS"
                searchPlaceholder="Search hotel day passes, resorts..."
                serviceTypes={['day_package']}
                defaultSearchCategory="day-packages"
            />
        </>
    )
}
