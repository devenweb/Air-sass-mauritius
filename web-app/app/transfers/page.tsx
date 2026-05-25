'use client'

import React from 'react'
import ServiceListing from '@/components/ServiceListing'

export default function TransfersPage() {
    return (
        <ServiceListing
            title="Premium <br /> Transfers."
            subtitle="Experience first-class service from the moment you land. Our professional chauffeurs provide seamless, door-to-door luxury across Mauritius with a premium fleet designed for ultimate comfort."
            heroImage="/assets/heroes/transfer_hero.png"
            serviceTypes={['transfer']}
            tag="LUXURY TRAVEL"
            searchPlaceholder="Search airport pickups, private shuttles..."
            defaultSearchCategory="transfers"
        />
    )
}
