import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import UnifiedServiceDetailWrapper from '@/components/UnifiedServiceDetailWrapper'
import { calculateLeadPrice } from '@/lib/services'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
    params: Promise<{ id: string }>
}

async function getActivity(id: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .in('service_type', ['activity', 'land_activity', 'sea_activity'])
        .single()

    if (error || !data) return null
    return data
}

import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const activity = await getActivity(id)
    if (!activity) return {}

    return {
        title: activity.meta_title || activity.name,
        description: activity.meta_description || activity.description,
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/activities/${id}`,
        },
        openGraph: {
            title: activity.meta_title || activity.name,
            description: activity.meta_description || activity.description,
            images: activity.image_url ? [activity.image_url] : [],
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/activities/${id}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: activity.meta_title || activity.name,
            description: activity.meta_description || activity.description,
            images: activity.image_url ? [activity.image_url] : [],
        }
    }
}

export default async function ActivityDetailPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch activity details
    const { data: activityData, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .in('service_type', ['activity', 'land_activity', 'sea_activity'])
        .single()

    if (error || !activityData) {
        notFound()
    }

    // 2. Fetch authoritative lead price using standardized helper
    const lowestPrice = await calculateLeadPrice(id, activityData.service_type)

    const activity = {
        ...activityData,
        lowestPrice: lowestPrice
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TouristAttraction',
        name: activity.name,
        description: activity.description,
        image: activity.image_url,
        location: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: activity.region,
                addressCountry: 'Mauritius'
            }
        },
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
                name: 'Activities',
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/activities`
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: activity.name,
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/activities/${id}`
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
            <UnifiedServiceDetailWrapper service={activity} serviceType="activity" />
        </>
    )
}
