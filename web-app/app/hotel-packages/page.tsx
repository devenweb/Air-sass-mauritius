'use client'

import React from 'react'
import ServiceListing from '@/components/ServiceListing'

export default function HotelPackagesPage() {
    return (
        <ServiceListing
            title="Local Island Escapes"
            subtitle="Special hotel stays and resident offers across Mauritius. Exclusive deals for local residents."
            heroImage="/assets/placeholders/hero-hotel.png"
            serviceTypes={['hotel']}
            includeRegions={['Mauritius']}
            tag="LOCAL DEAL"
            searchPlaceholder="Search local hotel deals..."
            showDateFilter={true}
            showCheckOutFilter={true}
            showOccupancyFilter={true}
            showRoomTypeFilter={true}
        />
    )
}
