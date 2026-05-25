import { Metadata } from 'next'
import { createClient } from '@/lib/supabase'
import HotelClientWrapper from '@/components/HotelClientWrapper'
import { notFound } from 'next/navigation'

type RoomType = {
  id: string;
  name: string;
  type: string;
  price: number;
  max_occupancy?: number;
  min_stay_days?: number;
  max_adults?: number;
  max_teens?: number;
  max_children?: number;
  max_infants?: number;
  child_age_limit?: number;
  amenities?: string[];
  image_url?: string;
  images?: string[];
  meal_plan?: string;
  description?: string;
}

type HotelDetails = {
  id: string;
  name: string;
  description: string;
  location: string;
  region: string;
  lowestPrice: number;
  rating: number;
  image_url?: string;
  secondary_image_url?: string;
  amenities?: string[];
  service_type: string;
  duration_days?: number;
  duration_hours?: number;
  max_group_size?: number;
  room_types?: RoomType[];
  gallery_images?: string[];
  meta_title?: string;
  meta_description?: string;
  special_features?: string[];
  highlights?: string[];
  included?: string[];
  not_included?: string[];
  cancellation_policy?: string;
  terms_and_conditions?: string;
  thumbnail_url?: string;
  banner_url?: string;
  featured?: boolean;
  priority?: number;
  max_adults?: number;
  max_children?: number;
  child_age_limit?: number;
  itinerary?: { day: string; title: string; desc?: string; description?: string; time?: string; image_url?: string }[];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = createClient()
  const { data: hotel } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .in('service_type', ['hotel', 'hotels', 'stays'])
    .single()

  if (!hotel) {
    return {}
  }

  return {
    title: hotel.meta_title || hotel.name,
    description: hotel.meta_description || hotel.description,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/hotels/${id}`,
    },
    openGraph: {
      title: hotel.meta_title || hotel.name,
      description: hotel.meta_description || hotel.description,
      images: hotel.image_url ? [hotel.image_url!] : [],
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/hotels/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: hotel.meta_title || hotel.name,
      description: hotel.meta_description || hotel.description,
      images: hotel.image_url ? [hotel.image_url!] : [],
    }
  }
}

export default async function HotelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()

  // 1. Fetch hotel details
  const { data: hotelData, error } = await supabase
    .from('services')
    .select('*, service_categories(category_id)')
    .eq('id', id)
    .eq('is_active', true)
    .in('service_type', ['hotel', 'hotels', 'stays'])
    .single()

  if (error || !hotelData) {
    notFound()
  }

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotelData.name,
    description: hotelData.description,
    image: hotelData.image_url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: hotelData.region,
      addressCountry: 'Mauritius'
    },
    starRating: {
      '@type': 'Rating',
      ratingValue: hotelData.rating || 4
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
        name: 'Hotels',
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/hotels`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: hotelData.name,
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/hotels/${id}`
      }
    ]
  }

  // 2. Fetch RELATIONAL room types from the dedicated table
  const { data: relationalRooms } = await supabase
    .from('room_types')
    .select('*')
    .eq('service_id', id);

  // 3. Fetch current pricing overrides for ALL variants of this service for "today"
  const today = new Date().toISOString().split('T')[0];
  const { data: currentPricing } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('service_id', id)
    .lte('date_from', today)
    .gte('date_to', today);

  // Process room types for the client component
  /* OLD IMPLEMENTATION - COMMENTED OUT TO ENSURE NO REGRESSIONS AND PRESERVE HISTORY
  const mappedRoomTypes: RoomType[] = (relationalRooms || []).map((room) => {
    const pricingOverride = currentPricing?.find(p => p.variant_id === room.id);
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    let finalPrice = 0;
    if (pricingOverride) {
      const basePrice = Number(pricingOverride.price || 0);
      const occ = pricingOverride.occupancy_pricing as Record<string, any>;
      let prices: number[] = [basePrice];
      
      if (occ && typeof occ === 'object') {
        const adultPrices = Object.entries(occ)
          .filter(([k]) => !isNaN(Number(k)))
          .map(([, v]) => {
            if (typeof v === 'object' && v !== null) {
              return Number((v as any).price || 0);
            }
            return Number(v);
          });
        prices = [...prices, ...adultPrices];
      }
      
      const valid = prices.filter(pr => !isNaN(pr) && pr > 0);
      finalPrice = valid.length > 0 ? Math.min(...valid) : 0;
    }

    return {
      id: room.id,
      name: room.name || 'Standard Room',
      type: room.name || 'standard',
      price: finalPrice,
      total_units: 1,
      features: room.amenities || [],
      max_occupancy: room.max_occupancy || 2,
      min_stay_days: room.min_stay_days || 1,
      min_stay: room.min_stay_days,
      max_adults: room.max_adults,
      max_children: room.max_children,
      max_teens: room.max_teens,
      max_infants: room.max_infants,
      child_age_limit: hotelData.child_age_limit || 12,
      is_active: true,
      image_url: room.image_url || hotelData.image_url,
      images: room.images || [],
      meal_plan: room.meal_plan,
      description: room.description,
    }
  });
  */

  // NEW IMPLEMENTATION: Calculate starting price for room types based on double occupancy (occupancy = "2")
  const mappedRoomTypes: RoomType[] = (relationalRooms || []).map((room: any) => {
    const roomPricings = currentPricing?.filter((p: any) => p.variant_id === room.id) || [];
    let finalPrice = 0;

    const doublePrices = roomPricings.map((pricingOverride: any) => {
      const occ = pricingOverride.occupancy_pricing as Record<string, any>;
      if (occ && typeof occ === 'object' && occ["2"]) {
        const v = occ["2"];
        if (typeof v === 'object' && v !== null) {
          return Number((v as any).price || (v as any).adult || 0);
        }
        return Number(v || 0);
      }
      
      // Fallback:
      const basePrice = Number(pricingOverride.price || 0);
      let prices: number[] = [basePrice];
      if (occ && typeof occ === 'object') {
        const otherPrices = Object.entries(occ)
          .filter(([k]) => !isNaN(Number(k)))
          .map(([, v]: [string, any]) => {
            if (typeof v === 'object' && v !== null) {
              return Number((v as any).price || (v as any).adult || 0);
            }
            return Number(v);
          });
        prices = [...prices, ...otherPrices];
      }
      const valid = prices.filter(pr => !isNaN(pr) && pr > 0);
      return valid.length > 0 ? Math.min(...valid) : 0;
    }).filter((p: any) => p > 0);

    if (doublePrices.length > 0) {
      finalPrice = Math.min(...doublePrices);
    }

    return {
      id: room.id,
      name: room.name || 'Standard Room',
      type: room.name || 'standard',
      price: finalPrice,
      total_units: 1,
      features: room.amenities || [],
      max_occupancy: room.max_occupancy || 2,
      min_stay_days: room.min_stay_days || 1,
      min_stay: room.min_stay_days,
      max_adults: room.max_adults,
      max_children: room.max_children,
      max_teens: room.max_teens,
      max_infants: room.max_infants,
      child_age_limit: hotelData.child_age_limit || 12,
      is_active: true,
      image_url: room.image_url || hotelData.image_url,
      images: room.images || [],
      meal_plan: room.meal_plan,
      description: room.description,
    }
  });

  // 4. Fetch the lead price from the pricing grid
  const validVariantIds = relationalRooms?.map((r: any) => r.id) || [];
  let leadPrice = 0;
  const pricingQuery = supabase
    .from('service_pricing')
    .select('price, occupancy_pricing, variant_id')
    .eq('service_id', id)
    .gte('date_to', today);

  if (validVariantIds.length > 0) {
    pricingQuery.in('variant_id', validVariantIds);
  } else {
    pricingQuery.is('variant_id', null);
  }

  const { data: globalMinGrid } = await pricingQuery;

  /* OLD IMPLEMENTATION - COMMENTED OUT TO ENSURE NO REGRESSIONS AND PRESERVE HISTORY
  if (globalMinGrid && globalMinGrid.length > 0) {
    const allPrices = globalMinGrid
      .map(p => {
        const basePrice = Number(p.price || 0);
        const occ = p.occupancy_pricing as Record<string, any>;
        let prices: number[] = [basePrice];
        
        if (occ && typeof occ === 'object') {
          const adultPrices = Object.entries(occ)
            .map(([k, v]) => {
              const numericKey = parseInt(k);
              if (isNaN(numericKey)) return null;
              
              if (typeof v === 'object' && v !== null) {
                return Number((v as any).price || 0);
              }
              return Number(v);
            })
            .filter((p): p is number => p !== null && !isNaN(p) && p > 0);
          prices = [...prices, ...adultPrices];
        }
        
        const valid = prices.filter(pr => !isNaN(pr) && pr > 0);
        return valid.length > 0 ? Math.min(...valid) : 0;
      })
      .filter(p => p > 0);
    
    if (allPrices.length > 0) {
      leadPrice = Math.min(...allPrices);
    }
  }
  */

  // NEW IMPLEMENTATION: Calculate starting price for the hotel based on double room occupancy (occupancy = "2")
  if (globalMinGrid && globalMinGrid.length > 0) {
    const allPrices = globalMinGrid
      .map((p: any) => {
        const occ = p.occupancy_pricing as Record<string, any>;
        if (occ && typeof occ === 'object' && occ["2"]) {
          const v = occ["2"];
          if (typeof v === 'object' && v !== null) {
            return Number((v as any).price || (v as any).adult || 0);
          }
          return Number(v || 0);
        }
        
        // Fallback:
        const basePrice = Number(p.price || 0);
        let prices: number[] = [basePrice];
        if (occ && typeof occ === 'object') {
          const adultPrices = Object.entries(occ)
            .map(([k, v]: [string, any]) => {
              const numericKey = parseInt(k);
              if (isNaN(numericKey)) return null;
              
              if (typeof v === 'object' && v !== null) {
                return Number((v as any).price || (v as any).adult || 0);
              }
              return Number(v);
            })
            .filter((p): p is number => p !== null && !isNaN(p) && p > 0);
          prices = [...prices, ...adultPrices];
        }
        const valid = prices.filter(pr => !isNaN(pr) && pr > 0);
        return valid.length > 0 ? Math.min(...valid) : 0;
      })
      .filter((p: any) => p > 0);
    
    if (allPrices.length > 0) {
      leadPrice = Math.min(...allPrices);
    }
  }

  // Fallback to room min today if leadPrice is still 0
  if (leadPrice === 0 && mappedRoomTypes.length > 0) {
    const validRoomPrices = mappedRoomTypes.map(r => r.price).filter(p => p > 0);
    if (validRoomPrices.length > 0) {
      leadPrice = Math.min(...validRoomPrices);
    }
  }

  // Update the hotel data with processed room types
  const hotel: HotelDetails = {
    ...hotelData,
    lowestPrice: leadPrice,
    image_url: hotelData.image_url || '/placeholder-hotel.jpg',
    banner_url: hotelData.banner_url,
    secondary_image_url: hotelData.secondary_image_url,
    amenities: hotelData.amenities || [],
    room_types: mappedRoomTypes
  }

  // Final assembly of SEO scripts
  const finalHotelJsonLd = {
    ...jsonLd,
    offers: leadPrice !== Infinity ? {
      '@type': 'AggregateOffer',
      priceCurrency: 'MUR',
      lowPrice: leadPrice,
      offerCount: mappedRoomTypes.length || 1,
      availability: 'https://schema.org/InStock'
    } : undefined
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(finalHotelJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HotelClientWrapper hotel={hotel} />
    </>
  )
}