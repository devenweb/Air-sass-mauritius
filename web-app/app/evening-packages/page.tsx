import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
    title: 'Evening Packages'
}

export default function EveningPackagesPage() {
    return (
        <ServiceListing
            pageSlug="evening-packages"
            tag="EVENING PASS"
            searchPlaceholder="Search evening passes, resorts..."
            defaultSearchCategory="evening-packages"
            categorySlug="evening-packages"
            showDateFilter={true}
            showOccupancyFilter={true}
            showMealPlanFilter={true}
            serviceTypes={['hotel', 'activity', 'land_activity', 'sea_activity', 'evening_package']}
        />
    )
}
