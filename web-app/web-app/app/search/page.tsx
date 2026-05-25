'use client'

import React, { Suspense } from 'react'
import ServiceListing from '@/components/ServiceListing'
import { useSearchParams } from 'next/navigation'

export default function GlobalSearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 animate-pulse" />}>
            <SearchPageContent />
        </Suspense>
    )
}

function SearchPageContent() {
    const searchParams = useSearchParams()
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const adults = searchParams.get('adults')
    const children = searchParams.get('children')
    const type = searchParams.get('type')
    
    const guestLabel = (Number(adults) || 2) + (Number(children) || 0)
    let searchSubtitle = 'Discover amazing deals and experiences worldwide'
    if (checkIn && checkOut) {
        searchSubtitle = `Available stays from ${checkIn} to ${checkOut} for ${guestLabel} travelers`
    }

    // Map search category to database service types
    const getServiceTypes = (category: string | null) => {
        if (!category) return ['hotel', 'hotels', 'stays', 'activity', 'activities', 'cruise', 'cruises', 'tour', 'tours', 'transfer', 'transfers', 'day_package', 'day-package', 'evening_package', 'evening-package', 'package', 'packages', 'restaurant', 'spa']
        if (category === 'hotels') return ['hotel', 'hotels', 'stays']
        if (category === 'activities') return ['activity', 'sea_activity', 'land_activity', 'activities']
        if (category === 'cruises') return ['cruise', 'cruises']
        if (category === 'tours' || category === 'group-tours') return ['tour', 'tours', 'guided_group_tour']
        if (category === 'transfers') return ['transfer', 'transfers']
        if (category === 'day-packages') return ['hotel', 'activity', 'land_activity', 'sea_activity', 'day_package', 'day-package', 'hotel_day_package']
        if (category === 'evening-packages') return ['hotel', 'activity', 'land_activity', 'sea_activity', 'evening_package', 'evening-package']
        if (category === 'packages') return ['package', 'packages', 'travel-package', 'travel-packages']
        if (category === 'restaurants') return ['restaurant', 'dining']
        if (category === 'spa') return ['spa', 'wellness', 'beauty']
        if (category === 'rodrigues') return ['hotel', 'hotels', 'stays']
        return [category]
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <ServiceListing 
                title="Search Results"
                subtitle={searchSubtitle}
                heroImage="/assets/placeholders/hero-hotel.png" 
                tag="Global Search"
                searchPlaceholder="Refine search by name or location..."
                compactHero={true}
                serviceTypes={getServiceTypes(type)}
                categorySlug={type === 'day-packages' ? 'day-packages' : type === 'evening-packages' ? 'evening-packages' : undefined}
            />
        </div>
    )
}
