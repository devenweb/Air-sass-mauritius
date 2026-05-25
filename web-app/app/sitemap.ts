import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabaseServer'
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://royaltravel.mu'
  const supabase = await createClient()

  // Static routes
  const staticRoutes = [
    '',
    '/hotels',
    '/tours',
    '/activities',
    '/cruises',
    '/packages',
    '/transfers',
    '/about',
    '/contact',
    '/faq',
    '/plan-my-trip',
    '/tailormade',
    '/privacy-policy',
    '/terms-conditions',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Fetch all active services for sitemap
  const { data: services } = await supabase
    .from('services')
    .select('id, updated_at, service_type')
    .eq('is_active', true)
    .limit(1000)

  const serviceRoutes = (services || []).map((service: any) => {
    // Basic routing logic matching app structure
    let typePath = service.service_type?.toLowerCase() || 'services'
    if (typePath === 'hotel') typePath = 'hotels'
    else if (typePath === 'tour') typePath = 'tours'
    else if (typePath === 'activity') typePath = 'activities'
    else if (typePath === 'cruise') typePath = 'cruises'
    else if (typePath === 'package') typePath = 'packages'
    else if (typePath === 'transfer') typePath = 'transfers'

    return {
      url: `${baseUrl}/${typePath}/${service.id}`,
      lastModified: new Date(service.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  return [...staticRoutes, ...serviceRoutes]
}
