import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import UnifiedServiceDetailWrapper from '@/components/UnifiedServiceDetailWrapper'
import { calculateLeadPrice } from '@/lib/services'
import { Metadata } from 'next'

interface Props {
    params: Promise<{ id: string }>
}

async function getPackage(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .in('service_type', ['package', 'packages'])
        .single()

    if (error || !data) return null
    return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const pkg = await getPackage(id)
    if (!pkg) return {}

    return {
        title: pkg.meta_title || pkg.name,
        description: pkg.meta_description || pkg.description,
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/packages/${id}`,
        },
        openGraph: {
            title: pkg.meta_title || pkg.name,
            description: pkg.meta_description || pkg.description,
            images: pkg.image_url ? [pkg.image_url] : [],
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/packages/${id}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: pkg.meta_title || pkg.name,
            description: pkg.meta_description || pkg.description,
            images: pkg.image_url ? [pkg.image_url] : [],
        }
    }
}

export default async function PackageDetailPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch package details
    const { data: pkgData, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .in('service_type', ['package', 'packages'])
        .single()

    if (error || !pkgData) {
        notFound()
    }

    // 2. Fetch authoritative lead price using standardized helper
    const lowestPrice = await calculateLeadPrice(id, pkgData.service_type)

    const pkg = {
        ...pkgData,
        lowestPrice: lowestPrice
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: pkg.name,
        description: pkg.description,
        image: pkg.image_url,
        touristType: 'Travel Package',
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
                name: 'Packages',
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/packages`
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: pkg.name,
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/packages/${id}`
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
            <UnifiedServiceDetailWrapper service={pkg} serviceType="package" />
        </>
    )
}
