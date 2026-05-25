import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './global.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnnouncementPopup from '@/components/AnnouncementPopup'
import FloatingSocial from '@/components/FloatingSocial'
import { AuthProvider } from '@/contexts/AuthContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { ThemeProvider } from 'next-themes'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import BackToTop from '@/components/BackToTop'
import CookieBanner from '@/components/CookieBanner'
import AIConcierge from '@/components/AIConcierge'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabaseServer'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import FacebookPixel from '@/components/FacebookPixel'

const font = Outfit({ 
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'seo_config')
      .single()

    const seo = data?.value as {metaTitle?: string, metaDescription?: string, metaKeywords?: string, ogImage?: string} || {}

    return {
      title: seo.metaTitle || 'Royal Travel Agency | Your Gateway to Extraordinary Journeys',
      description: seo.metaDescription || 'Discover amazing hotels, cruises, tours, and travel experiences worldwide',
      keywords: seo.metaKeywords || 'travel, mauritius, holidays',
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://travellounge.mu'),
      icons: {
        icon: '/assets/logo-red-bird.png',
        apple: '/assets/logo-red-bird.png',
      },
      openGraph: {
        title: seo.metaTitle || 'Royal Travel Agency',
        description: seo.metaDescription,
        images: seo.ogImage ? [{ url: seo.ogImage }] : [{ url: '/assets/logo-red-bird.png' }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: seo.metaTitle,
        description: seo.metaDescription,
        images: seo.ogImage ? [seo.ogImage] : ['/assets/logo-red-bird.png'],
      }
    }
  } catch {
    return {
      title: 'Royal Travel Agency | Your Gateway to Extraordinary Journeys',
      description: 'Discover amazing hotels, cruises, tours, and travel experiences worldwide',
      icons: {
        icon: '/assets/logo-red-bird.png',
      }
    }
  }
}

import { Suspense } from 'react'

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale?: string }>
}) {
  const resolvedParams = await params
  const currentLocale = resolvedParams.locale || 'en'

  const siteNavigationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': [
      { '@type': 'SiteNavigationElement', 'position': 1, 'name': 'Hotels', 'url': 'https://travellounge.mu/hotels' },
      { '@type': 'SiteNavigationElement', 'position': 2, 'name': 'Tours', 'url': 'https://travellounge.mu/tours' },
      { '@type': 'SiteNavigationElement', 'position': 3, 'name': 'Activities', 'url': 'https://travellounge.mu/activities' },
      { '@type': 'SiteNavigationElement', 'position': 4, 'name': 'Cruises', 'url': 'https://travellounge.mu/cruises' },
      { '@type': 'SiteNavigationElement', 'position': 5, 'name': 'Day Packages', 'url': 'https://travellounge.mu/packages' },
      { '@type': 'SiteNavigationElement', 'position': 6, 'name': 'About Us', 'url': 'https://travellounge.mu/about' },
      { '@type': 'SiteNavigationElement', 'position': 7, 'name': 'Contact', 'url': 'https://travellounge.mu/contact' }
    ]
  }

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Royal Travel Agency',
    image: 'https://travellounge.mu/assets/logo-red-bird.png',
    '@id': 'https://travellounge.mu',
    url: 'https://travellounge.mu',
    telephone: '+230 212 4070',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '15 Sir William Newton St',
      addressLocality: 'Port Louis',
      postalCode: '11328',
      addressCountry: 'MU'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -20.162,
      longitude: 57.501
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday'
      ],
      opens: '09:00',
      closes: '17:00'
    },
    priceRange: '$$'
  }

  return (
    <html lang={currentLocale} suppressHydrationWarning>
      <head>
        <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <FacebookPixel PIXEL_ID={process.env.NEXT_PUBLIC_FB_PIXEL_ID || ''} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://qhrmzuwawmuxrnaqznva.supabase.co" />
        {/* Version: 1.1.1 - Royal Travel Agency 2026 Restore (2026-05-14) */}
      </head>
      <body className={font.className}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <CurrencyProvider>
              <SettingsProvider>
                <AuthProvider>
                  <WishlistProvider>
                    <div className="flex flex-col min-h-screen">
                      <Suspense fallback={null}>
                        <Navbar />
                        <main className="flex-grow">
                          {children}
                        </main>
                        <FloatingSocial />
                        <Footer />
                      </Suspense>
                      <BackToTop />
                      <AnnouncementPopup />
                    </div>
                  <Toaster richColors position="top-right" />
                </WishlistProvider>
              </AuthProvider>
            </SettingsProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
