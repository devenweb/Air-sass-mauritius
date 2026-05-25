import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import UnifiedServiceDetailWrapper from '@/components/UnifiedServiceDetailWrapper'
import { calculateLeadPrice } from '@/lib/services'
import { Metadata } from 'next'

interface Props {
    params: Promise<{ id: string }>
}

async function getCruise(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .in('service_type', ['cruise', 'cruises'])
        .single()

    if (error || !data) return null
    return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const cruise = await getCruise(id)
    if (!cruise) return {}

    return {
        title: cruise.meta_title || cruise.name,
        description: cruise.meta_description || cruise.description,
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/cruises/${id}`,
        },
        openGraph: {
            title: cruise.meta_title || cruise.name,
            description: cruise.meta_description || cruise.description,
            images: cruise.image_url ? [cruise.image_url] : [],
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/cruises/${id}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: cruise.meta_title || cruise.name,
            description: cruise.meta_description || cruise.description,
            images: cruise.image_url ? [cruise.image_url] : [],
        }
    }
}

export default async function CruiseDetailPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch cruise details
    const { data: cruiseData, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .in('service_type', ['cruise', 'cruises'])
        .single()

    if (error || !cruiseData) {
        notFound()
    }

    // 2. Fetch authoritative lead price using standardized helper
    const lowestPrice = await calculateLeadPrice(id, cruiseData.service_type)

    const cruise = {
        ...cruiseData,
        lowestPrice: lowestPrice
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: cruise.name,
        description: cruise.description,
        image: cruise.image_url,
        touristType: 'Cruise',
        offers: {
            '@type': 'Offer',
            price: lowestPrice,
            priceCurrency: 'MUR',
            availability: 'https://schema.org/InStock'
        }
    }

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${process.env.NEXT_PUBLIC_SITE_URL}`
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Cruises',
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/cruises`
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: cruise.name,
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/cruises/${id}`
            }
        ]
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <UnifiedServiceDetailWrapper service={cruise} serviceType="cruise" />
        </>
    )
}
