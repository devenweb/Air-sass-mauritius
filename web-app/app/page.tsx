import { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Travel Lounge | Your Gateway to Extraordinary Journeys',
  description: 'Experience world-class travel with Mauritius\'s premier boutique agency. Book luxury hotels, exclusive cruises, and bespoke tours with expert local guidance.',
  alternates: {
    canonical: 'https://travellounge.mu',
  },
  openGraph: {
    title: 'Travel Lounge | Premium Travel Experiences',
    description: 'Expertly curated travel experiences in Mauritius and beyond.',
    url: 'https://travellounge.mu',
    siteName: 'Travel Lounge',
    images: [
      {
        url: '/assets/logo-red-bird.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

async function getSEOContent() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return null

    const url = `${supabaseUrl}/rest/v1/content_blocks?page_slug=eq.home&section_key=eq.section_5_seo_content&select=content&limit=1`
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const rows = await res.json()
    return rows?.[0]?.content || null
  } catch (err) {
    console.error('Error fetching SEO content:', err)
    return null
  }
}

export default async function HomePage() {
  const seoContent = await getSEOContent();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Travel Lounge',
    url: 'https://travellounge.mu',
    logo: 'https://travellounge.mu/assets/logo-red-bird.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+230-212-4070',
      contactType: 'customer service',
      areaServed: 'MU',
      availableLanguage: ['English', 'French']
    },
    sameAs: [
      'https://www.facebook.com/travellounge',
      'https://www.instagram.com/travellounge'
    ]
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Travel Lounge',
    url: 'https://travellounge.mu',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://travellounge.mu/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HomeClient />

      {/* SEO Enrichment Section - Server Rendered for LLM/GEO Readability */}
      <section className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-12 tracking-tighter max-w-4xl">
              {seoContent?.title || 'Your Premier Boutique Travel Agency in Mauritius'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 items-start">
              <div className="space-y-6">
                <div 
                  className="text-xl text-slate-600 leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ __html: seoContent?.paragraph_1 || 'Experience the pinnacle of Luxury Mauritius Travel with Travel Lounge.' }}
                />
              </div>
              <div className="space-y-6">
                <div 
                  className="text-lg text-slate-500 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: seoContent?.paragraph_2 || 'Whether you are seeking all-inclusive holiday packages, exclusive catamaran cruises, or bespoke world tours departing from Mauritius...' }}
                />
              </div>
              <div className="space-y-6 lg:pl-12 lg:border-l lg:border-slate-100">
                <h4 className="text-xl font-black text-red-600 uppercase tracking-widest mb-6">
                    {seoContent?.why_choose_label || "Why Choose Our Agency?"}
                </h4>
                <ul className="space-y-6">
                  {(Array.isArray(seoContent?.why_choose_list) 
                    ? seoContent?.why_choose_list 
                    : [
                        "Tailor-made itineraries crafted by local Mauritius destination experts.",
                        "Exclusive access to boutique hotels and private villa collections.",
                        "24/7 personalized concierge support throughout your stay."
                      ]
                  ).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                      </div>
                      <p className="text-slate-600 font-bold m-0 text-sm leading-tight">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
      </section>
    </main>
  )
}