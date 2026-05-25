import { Metadata } from 'next'
import AboutClient from '@/components/AboutClient'

export const metadata: Metadata = {
    title: 'About Us | Travel Lounge Mauritius',
    description: 'Learn more about Travel Lounge, Mauritius\'s premier boutique travel agency. Our legacy of excellence, vision, and commitment to creating extraordinary journeys.',
    alternates: {
        canonical: 'https://travellounge.mu/about',
    }
}

export default function AboutPage() {
    return <AboutClient />
}
