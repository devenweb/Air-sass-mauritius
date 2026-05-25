'use client'

import React from 'react'
import ServiceListing from '@/components/ServiceListing'

export default function LandActivitiesPage() {
    return (
        <ServiceListing
            pageSlug="activities-land"
            title="Land Adventures"
            subtitle="Discover the landscapes with our premium land activities and excursions."
            heroImage="https://images.unsplash.com/photo-1467377229985-514271ad8182?q=80&w=2070&auto=format&fit=crop"
            serviceTypes={['activity', 'land_activity']}
            activityType="Land"
            tag="LAND ADVENTURE"
            searchPlaceholder="Search for quad biking, hiking, tours..."
            defaultSearchCategory="activities"
        />
    )
}
