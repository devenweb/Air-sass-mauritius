import { createClient } from './supabase';

const supabase = createClient();

export interface MealPlan {
    label: string;
    price?: number;
}

export interface RoomType {
  id: string;
  service_id: string;
  name: string;
  type?: string;
  description?: string;
  price?: number;
  weekday_price?: number;
  weekend_price?: number;
  max_occupancy?: number;
  max_adults?: number;
  max_teens?: number;
  max_children?: number;
  max_infants?: number;
  min_stay_days?: number;
  image_url?: string;
  images?: string[];
  amenities?: string[];
  features?: string[];
  meal_plan?: string;
  service_fee?: number;
}

export interface Service {
    id: string;
    name: string;
    location: string;
    image_url: string;
    duration_days?: number;
    duration_hours?: number;
    service_type: string;
    rating?: number;
    region?: string;
    amenities?: string[] | string;
    is_seasonal_deal?: boolean;
    deal_note?: string;
    description?: string;
    short_description?: string;
    max_group_size?: number;
    max_adults?: number;
    max_children?: number;
    max_teens?: number;
    max_infants?: number;
    child_age_limit?: number;
    room_types?: RoomType[];
    itinerary?: unknown[];
    stock?: number;
    status?: string;
    cta_text?: string;
    cta_link?: string;
    gallery_images?: string[];
    banner_url?: string;
    meal_plans?: MealPlan[];
    lowestPrice?: number;
    activity_type?: string;
    is_active?: boolean;
    is_coming_soon?: boolean;
    badge_text?: string;
    price?: number;
    price_teen?: number;
    price_child?: number;
    price_infant?: number;
    service_fee?: number;
}

export const SERVICE_SELECT_FIELDS = [
    'id', 'name', 'location', 'image_url', 
    'duration_days', 'duration_hours', 'service_type', 
    'rating', 'region', 'amenities', 'is_seasonal_deal', 'deal_note',
    'description', 'max_group_size', 'max_adults', 'max_children',
    'child_age_limit', 'room_types', 'short_description', 'meal_plans', 'banner_url', 'activity_type', 'gallery_images', 'is_active', 'badge_text',
    'service_categories(categories(slug))'
].join(', ');

export async function enrichServicesWithLeadPrice(services: Service[]) {
    if (!services || services.length === 0) return services;

    const serviceIds = services.map(s => s.id);
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const [roomsResponse, gridResponse] = await Promise.all([
            supabase.from('room_types').select('id, service_id').in('service_id', serviceIds),
            supabase.from('service_pricing')
                .select('service_id, variant_id, price, occupancy_pricing')
                .in('service_id', serviceIds)
                .gte('date_to', today)
                .order('date_from', { ascending: true })
                .limit(40000)
        ]);

        const rooms = roomsResponse.data || [];
        const gridPrices = gridResponse.data || [];

        return services.map(service => {
            try {
                const serviceId = String(service.id);
                const validVariantIds = rooms.filter((r: any) => String(r.service_id) === serviceId).map((r: any) => r.id).filter(Boolean);
                
                let serviceGrid = gridPrices.filter((g: any) => String(g.service_id) === serviceId);
                
                let filteredGrid = serviceGrid.filter((g: any) => 
                    (g as any).variant_id && validVariantIds.includes((g as any).variant_id)
                );

                // 2. If no variant-specific pricing exists, fallback to generic pricing (where variant_id is null)
                if (filteredGrid.length === 0) {
                    filteredGrid = serviceGrid.filter((g: any) => !(g as any).variant_id);
                }
                
                /* OLD IMPLEMENTATION - COMMENTED OUT TO ENSURE NO REGRESSIONS AND PRESERVE HISTORY
                const allPossiblePrices = filteredGrid.map(g => {
                    const basePrice = Number(g.price || 0);
                    const occ = (g as any).occupancy_pricing as Record<string, any>;
                    
                    let prices: number[] = [basePrice];
                    
                    if (occ && typeof occ === 'object') {
                        const adultPrices = Object.entries(occ)
                            .map(([k, v]) => {
                                // Extract numeric value from key (e.g. "1_adult" -> 1, "2" -> 2)
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
                    
                const validPrices = prices.filter(p => !isNaN(p) && p > 0);
                return validPrices.length > 0 ? Math.min(...validPrices) : 0;
            }).filter(p => p > 0);
            */

            const isHotel = ['hotel', 'hotels', 'stays'].includes(service.service_type?.toLowerCase() || '');
            const allPossiblePrices = filteredGrid.map((g: any) => {
                const occ = (g as any).occupancy_pricing as Record<string, any>;
                if (isHotel && occ && typeof occ === 'object' && occ["2"]) {
                    const v = occ["2"];
                    if (typeof v === 'object' && v !== null) {
                        return Number((v as any).price || (v as any).adult || 0);
                    }
                    return Number(v || 0);
                }
                
                const basePrice = Number(g.price || 0);
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
                
                const validPrices = prices.filter(p => !isNaN(p) && p > 0);
                return validPrices.length > 0 ? Math.min(...validPrices) : 0;
            }).filter((p: number) => p > 0);

            return {
                ...service,
                lowestPrice: allPossiblePrices.length > 0 ? Math.min(...allPossiblePrices) : 0
            };
            } catch (err) {
                console.error(`Error enriching service ${service.id}:`, err);
                return service;
            }
        });
    } catch (error) {
        console.error('Error in enrichServicesWithLeadPrice:', error);
        return services.map(s => ({ ...s, lowestPrice: 0 }));
    }
}

/**
 * Authoritative lead price calculator for a single service.
 * Standardizes logic across all detail pages to handle complex occupancy_pricing objects.
 */
export async function calculateLeadPrice(serviceId: string, serviceType: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const [roomsResponse, gridResponse] = await Promise.all([
            supabase.from('room_types').select('id').eq('service_id', serviceId),
            supabase.from('service_pricing')
                .select('variant_id, price, occupancy_pricing')
                .eq('service_id', serviceId)
                .gte('date_to', today)
                .limit(1000)
        ]);

        const rooms = roomsResponse.data || [];
        const gridPrices = gridResponse.data || [];
        const validVariantIds = rooms.map((r: any) => r.id).filter(Boolean);
        let filteredGrid = gridPrices.filter((g: any) => {
            const vid = (g as any).variant_id;
            return vid && validVariantIds.includes(vid);
        });

        if (filteredGrid.length === 0) {
            filteredGrid = gridPrices.filter((g: any) => !(g as any).variant_id);
        }

        /* OLD IMPLEMENTATION - COMMENTED OUT TO ENSURE NO REGRESSIONS AND PRESERVE HISTORY
        const allPossiblePrices = filteredGrid.map(g => {
            const basePrice = Number(g.price || 0);
            const occ = g.occupancy_pricing as Record<string, any>;
            
            let prices: number[] = [basePrice];
            
            if (occ && typeof occ === 'object') {
                const adultPrices = Object.entries(occ)
                    .map(([k, v]) => {
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
            
            const validPrices = prices.filter(p => !isNaN(p) && p > 0);
            return validPrices.length > 0 ? Math.min(...validPrices) : 0;
        }).filter(p => p > 0);
        */

        const isHotel = ['hotel', 'hotels', 'stays'].includes(serviceType?.toLowerCase() || '');
        const allPossiblePrices = filteredGrid.map((g: any) => {
            const occ = g.occupancy_pricing as Record<string, any>;
            if (isHotel && occ && typeof occ === 'object' && occ["2"]) {
                const v = occ["2"];
                if (typeof v === 'object' && v !== null) {
                    return Number((v as any).price || (v as any).adult || 0);
                }
                return Number(v || 0);
            }
            
            const basePrice = Number(g.price || 0);
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
            
            const validPrices = prices.filter(p => !isNaN(p) && p > 0);
            return validPrices.length > 0 ? Math.min(...validPrices) : 0;
        }).filter((p: number) => p > 0);

        return allPossiblePrices.length > 0 ? Math.min(...allPossiblePrices) : 0;
    } catch (error) {
        console.error('Error in calculateLeadPrice:', error);
        return 0;
    }
}

export const getServiceLink = (service: Service | any) => {
    const type = service.service_type?.toLowerCase() || ''
    const category_slug = service.category_slug || (service.service_categories?.[0]?.categories?.slug) || ''
    
    let link = ''
    // Exact mapping based on authoritative routes
    if (type === 'hotel' || type === 'stays' || type === 'hotels') link = `/hotels/${service.id}`
    else if (type === 'tour' || type === 'guided_group_tour' || type === 'tours' || category_slug === 'guided-group-tours') link = `/tours/${service.id}`
    else if (type === 'activity' || type === 'sea_activity' || type === 'land_activity' || type === 'activities') link = `/activities/${service.id}`
    else if (type === 'cruise' || type === 'cruises') link = `/cruises/${service.id}`
    else if (type === 'transfer' || type === 'transfers') link = `/transfers/${service.id}`
    else if (type === 'visa') link = `/visa-services` 
    else if (type === 'flight') link = `/flights/${service.id}`
    else if (type === 'evening_package' || type === 'evening-package' || category_slug === 'evening-packages') link = `/evening-packages/${service.id}`
    else if (type === 'package' || type === 'packages' || type === 'travel-package' || type === 'travel-packages' || category_slug === 'travel-packages') {
        link = `/travel-packages/${service.id}`
    }
    else if (type === 'day-package' || type === 'day_package' || type === 'hotel_day_package' || category_slug === 'day-packages') {
        link = `/day-packages/${service.id}`
    }
    else if (type === 'restaurant') link = `/restaurants/${service.id}`
    else if (type === 'spa' || type === 'beauty') link = `/spa/${service.id}`
    else link = `/search/details/${service.id}`

    if (service.region?.toLowerCase() === 'rodrigues' || service.location?.toLowerCase().includes('rodrigues')) {
        link += (link.includes('?') ? '&' : '?') + 'brand=normal'
    }
    return link
}
