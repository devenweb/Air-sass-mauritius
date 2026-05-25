import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
    title: 'Day Packages'
}

export default function DayPackagesPage() {
    return (
        <ServiceListing
            pageSlug="day-packages"
            tag="DAY PASS"
            searchPlaceholder="Search day passes, resorts..."
            defaultSearchCategory="day-packages"
            categorySlug="day-packages"
            showDateFilter={true}
            showOccupancyFilter={true}
            showMealPlanFilter={true}
            serviceTypes={['hotel', 'activity', 'land_activity', 'sea_activity', 'day_package']}
        />
    )
}
