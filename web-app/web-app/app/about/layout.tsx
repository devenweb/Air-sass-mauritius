import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'About Us | Travel Lounge Mauritius',
    description: 'Learn about Travel Lounge Mauritius, our vision, mission, and our dedicated team of travel experts.',
}

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
