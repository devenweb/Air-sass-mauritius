'use client'

import React from 'react'
import ServiceListing from '@/components/ServiceListing'

export default function SeaActivitiesPage() {
    return (
        <ServiceListing
            pageSlug="activities-sea"
            title="Sea Adventures"
            subtitle="Explore the crystal clear waters with our premium sea activities and excursions."
            heroImage="https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop"
            serviceTypes={['activity', 'sea_activity']}
            activityType="Sea"
            tag="SEA ADVENTURE"
            searchPlaceholder="Search for dolphin watching, cruises, water sports..."
            defaultSearchCategory="activities"
        />
    )
}
