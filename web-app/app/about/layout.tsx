import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'About Us | Royal Travel Agency Mauritius',
    description: 'Learn about Royal Travel Agency Mauritius, our vision, mission, and our dedicated team of travel experts.',
}

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
