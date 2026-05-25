import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Cruise Holidays | Travel Lounge Mauritius',
    description: 'Set sail for amazing destinations with our trusted cruise partners. Browse our selection of cruise packages.',
}

export default function CruisesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
