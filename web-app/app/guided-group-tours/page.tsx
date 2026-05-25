import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
    title: 'Guided Group Tours | Travel Lounge Mauritius',
    description: 'Join our expertly guided group tours across Mauritius. All-inclusive itineraries, professional local guides, and unforgettable shared experiences.',
}

export default function GroupToursPage() {
    return (
        <ServiceListing
            pageSlug="guided-group-tours"
            title="Guided Group Travel"
            subtitle="Join like-minded people and explore the island with our local experts. Everything is planned so you can relax."
            heroImage="/assets/hero/group_tours_hero_1773391421071.png"
            tag="GROUP TOUR"
            searchPlaceholder="Search group tours, destinations..."
            serviceTypes={['tour']}
            showOccupancyFilter={true}
            defaultSearchCategory="group-tours"
        />
    )
}
