import { Metadata } from 'next'
import ServiceListing from '@/components/ServiceListing'
import { createClient } from '@/lib/supabaseServer'
import { resolveImageUrl } from '@/lib/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
    title: '🏖️ 25+ Best Things to Do in Mauritius: Activities & Experiences',
    description: 'From underwater walks to mountain hikes, discover the definitive list of things to do in Mauritius. Book activities online at the best local rates.',
    alternates: {
        canonical: 'https://travellounge.mu/activities',
    },
    openGraph: {
        title: 'Top Mauritius Activities & Experiences | Travel Lounge',
        description: 'Your guide to the best adventures and things to do in Mauritius.',
        url: 'https://travellounge.mu/activities',
        type: 'website',
    }
}

async function getActivitiesContent() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('content_blocks')
        .select('section_key, content')
        .eq('page_slug', 'activities')
    
    const contentMap: any = {}
    data?.forEach((block: any) => {
        contentMap[block.section_key] = block.content
    })
    return contentMap
}

export default async function ActivitiesPage() {
    const content = await getActivitiesContent()
    const hero = content.hero || {}

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://travellounge.mu'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Activities',
                item: 'https://travellounge.mu/activities'
            }
        ]
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ServiceListing
                title={hero.title || "Activities & Experiences"}
                subtitle={hero.description || "Unique adventures and unforgettable moments across the most beautiful islands."}
                heroImage={resolveImageUrl(hero.image_url, "/assets/hero/rodrigues_hotels_hero_1773391499243.png")}
                serviceTypes={['activity', 'sea_activity', 'land_activity']}
                tag="ACTIVITY"
                searchPlaceholder="Search for activities, locations..."
                showOccupancyFilter={true}
                defaultSearchCategory="activities"
            />
        </>
    )
}
