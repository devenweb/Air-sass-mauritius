'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export const LEISURE_ROUTES = [
  '/local-deals',
  '/hotels',
  '/activities',
  '/day-packages',
  '/evening-packages',
  '/mauritius',
  '/restaurants',
  '/spa',
  '/transfers'
]

export function useBrand() {
  const pathname = usePathname()
  const [isLeisure, setIsLeisure] = useState(false)

  useEffect(() => {
    const checkLeisure = () => {
      if (typeof window !== 'undefined' && (window as any).__RODRIGUES_OVERRIDE__) {
        return false
      }
      if (!pathname) return false
      
      // Force normal brand for Rodrigues
      if (pathname.toLowerCase().includes('rodrigues')) return false;

      // Check if path starts with any leisure route
      return LEISURE_ROUTES.some(route => pathname.startsWith(route))
    }
    setIsLeisure(checkLeisure())
  }, [pathname])

  // Force brand from search params if present
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const brandParam = searchParams.get('brand')
    
    // Check for Rodrigues in current state/path as well to avoid flickering
    const isRodrigues = pathname?.toLowerCase().includes('rodrigues') || (typeof window !== 'undefined' && (window as any).__RODRIGUES_OVERRIDE__)
    if (isRodrigues) {
      setIsLeisure(false)
      return
    }

    if (brandParam === 'leisure') setIsLeisure(true)
    if (brandParam === 'normal') setIsLeisure(false)
  }, [pathname])

  useEffect(() => {
    const handleOverride = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail === 'normal') {
        setIsLeisure(false)
      } else if (detail === 'reset') {
        const isRodrigues = pathname?.toLowerCase().includes('rodrigues') || (typeof window !== 'undefined' && (window as any).__RODRIGUES_OVERRIDE__)
        if (isRodrigues) {
          setIsLeisure(false)
        } else {
          const searchParams = new URLSearchParams(window.location.search)
          const brandParam = searchParams.get('brand')
          if (brandParam === 'leisure') {
            setIsLeisure(true)
          } else if (brandParam === 'normal') {
            setIsLeisure(false)
          } else {
            const hasLeisurePath = LEISURE_ROUTES.some(route => pathname?.startsWith(route))
            setIsLeisure(hasLeisurePath)
          }
        }
      }
    }
    window.addEventListener('brand-override', handleOverride)
    return () => {
      window.removeEventListener('brand-override', handleOverride)
    }
  }, [pathname])
  
    return {
    isLeisure,
    brandName: isLeisure ? 'Travel Lounge Leisure & Tours' : 'Travel Lounge',
    logo: isLeisure ? '/assets/logo-leisure.png' : '/assets/logo.png',
    email: isLeisure ? 'inbound@travellounge.mu' : 'reservation@travellounge.mu',
    whatsapp: isLeisure ? '23055097702' : '23059407711',
    whatsappFormatted: isLeisure ? '55097702' : '59407711',
    instagram: isLeisure ? 'travellounge_leisure' : 'travellounge_ltd',
    facebook: isLeisure ? 'travellounge.leisure' : 'travellounge.mu',
    contactPhone: isLeisure ? '+230 2124070' : '+230 2124070'
  }
}
