'use client'

import React from 'react'
import ServiceListing from '@/components/ServiceListing'

const MAURITIUS_REGIONS = ['North', 'East', 'South', 'West', 'Mauritius', 'North Coast', 'East Coast', 'South Coast', 'West Coast']

export default function MauritiusHotelsPage() {
    return (
        <ServiceListing
            title="Mauritius Hotels"
            subtitle="Explore our curated selection of luxury resorts and boutique hotels across Mauritius."
            heroImage="/assets/heroes/hero-hotels.png"
            serviceTypes={['hotel']}
            includeRegions={MAURITIUS_REGIONS}
            excludeRegions={['Rodrigues']}
            tag="MAURITIUS"
            searchPlaceholder="Search hotels in Mauritius..."
            showDateFilter={true}
            showCheckOutFilter={true}
            showOccupancyFilter={true}
            showRoomTypeFilter={true}
        />
    )
}
