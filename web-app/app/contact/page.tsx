import { Metadata } from 'next'
import ContactClient from '@/components/ContactClient'

export const metadata: Metadata = {
    title: 'Contact Us | Royal Travel Agency Mauritius',
    description: 'Get in touch with our travel experts. Visit our offices in Port Louis and Ebene, or contact our concierge via phone, WhatsApp, or email for personalized assistance.',
    alternates: {
        canonical: 'https://royaltravel.mu/contact',
    }
}

export default function ContactPage() {
    return <ContactClient />
}
