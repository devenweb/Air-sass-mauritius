import { createClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import UnifiedServiceDetailWrapper from '@/components/UnifiedServiceDetailWrapper'
import { calculateLeadPrice } from '@/lib/services'
import { Metadata } from 'next'

async function getPackage(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()
    
    if (error || !data) return null
    return data
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const { id } = await params
    const pkg = await getPackage(id)
    if (!pkg) return { title: 'Package Not Found' }

    return {
        title: `${pkg.name} | International Travel Packages`,
        description: pkg.short_description || pkg.description?.substring(0, 160),
        alternates: {
            canonical: `https://royaltravel.mu/travel-packages/${id}`,
        },
        openGraph: {
            title: pkg.name,
            description: pkg.short_description,
            images: [pkg.image_url],
            url: `https://royaltravel.mu/travel-packages/${id}`,
            type: 'website',
        }
    }
}

export default async function TravelPackageDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch package details
    const { data: pkgData, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

    if (error || !pkgData) notFound()

    // 2. Fetch authoritative lead price using standardized helper
    const lowestPrice = await calculateLeadPrice(id, pkgData.service_type)

    // 3. Fetch itineraries (variants)
    const { data: itineraries } = await supabase
        .from('room_types')
        .select('*')
        .eq('service_id', id)
        .order('name')

    // 4. Fetch pricing for the variants
    const today = new Date().toISOString().split('T')[0];
    const { data: currentPricing } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_id', id)
        .lte('date_from', today)
        .gte('date_to', today);

    // Map pricing to itineraries
    const mappedItineraries = (itineraries || []).map((variant: any) => {
        const pricingOverride = currentPricing?.find((p: any) => p.variant_id === variant.id);
        let finalPrice = 0;
        
        if (pricingOverride) {
            const occ = pricingOverride.occupancy_pricing as Record<string, any>;
            // Check for Double first
            const dbl = occ ? (occ['2'] ?? occ[2]) : null;
            if (dbl !== undefined && dbl !== null) {
                finalPrice = typeof dbl === 'object' ? Number(dbl.price || 0) : Number(dbl);
            } 
            // Fallback to Single/Default
            else if (pricingOverride.price) {
                finalPrice = Number(pricingOverride.price);
            } else {
                const sgl = occ ? (occ['1'] ?? occ[1]) : null;
                if (sgl !== undefined && sgl !== null) {
                    finalPrice = typeof sgl === 'object' ? Number(sgl.price || 0) : Number(sgl);
                }
            }
        }

        return {
            ...variant,
            price: finalPrice
        };
    });

    const pkg = {
        ...pkgData,
        lowestPrice: lowestPrice,
        variants: mappedItineraries
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: pkg.name,
        description: pkg.description,
        image: pkg.image_url,
        touristType: 'International Travel Package',
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
                item: 'https://royaltravel.mu'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Travel Abroad',
                item: 'https://royaltravel.mu/travel-abroad'
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: 'Travel Packages',
                item: 'https://royaltravel.mu/travel-packages'
            },
            {
                '@type': 'ListItem',
                position: 4,
                name: pkg.name,
                item: `https://royaltravel.mu/travel-packages/${id}`
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
            <UnifiedServiceDetailWrapper 
                service={pkg as any} 
                serviceType="package"
                backLink="/travel-packages"
            />
        </>
    )
}
