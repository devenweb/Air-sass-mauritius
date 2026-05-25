export interface FilterState {
  adults: number;
  teenagers: number;
  children: number;
  infants: number;
  priceRange: [number, number];
  amenities: string[];
}

/**
 * Validates if a service meets the requested occupancy criteria.
 * Mirror of the web-app's deep occupancy validation.
 */
export function validateOccupancy(service: any, filters: FilterState): boolean {
  const { adults, teenagers, children, infants } = filters;
  const totalPax = adults + teenagers + children + infants;

  if (totalPax === 0) return true;

  // 1. Hotel-specific deep validation (using room_types JSONB)
  if (service.service_type?.toLowerCase() === 'hotel' || service.service_type?.toLowerCase() === 'stays') {
    const roomTypes = Array.isArray(service.room_types) ? service.room_types : [];
    
    if (roomTypes.length > 0) {
      // Check if AT LEAST ONE room type can accommodate the group
      return roomTypes.some((rt: any) => {
        const rMaxAdults = rt.max_adults ?? rt.max_occupancy ?? 2;
        const rMaxChildren = rt.max_children ?? 0;
        const rMaxTeens = rt.max_teens ?? 0;
        const rMaxInfants = rt.max_infants ?? 0;
        const rTotalMax = rt.max_occupancy ?? (rMaxAdults + rMaxChildren + rMaxTeens + rMaxInfants);

        // Strict room occupancy check
        if (adults > rMaxAdults) return false;
        // 0 usually means unlimited or not specified in our schema if it was explicitly set, 
        // but NULL usually means not accepted. However, for mobile we'll assume 0/null is "not specified/none" 
        // unless it's a hotel where we have strict rules.
        if (teenagers > 0 && rMaxTeens !== 0 && teenagers > rMaxTeens) return false;
        if (children > 0 && rMaxChildren !== 0 && children > rMaxChildren) return false;
        if (infants > 0 && rMaxInfants !== 0 && infants > rMaxInfants) return false;
        if (totalPax > rTotalMax) return false;

        return true;
      });
    }
  }

  // 2. Generic service level check (Activities, Tours, etc.)
  if (service.max_group_size && totalPax > service.max_group_size) return false;
  if (service.max_adults && adults > service.max_adults) return false;
  
  // For packages/activities, children might include teens
  const totalKids = teenagers + children;
  if (service.max_children && totalKids > service.max_children) return false;

  return true;
}

/**
 * Validates if a service has all requested amenities.
 */
export function validateAmenities(service: any, requestedAmenities: string[]): boolean {
  if (!requestedAmenities || requestedAmenities.length === 0) return true;

  const sAmenities = Array.isArray(service.amenities) 
    ? service.amenities.map((a: any) => typeof a === 'string' ? a.toLowerCase() : a.item?.toLowerCase()).filter(Boolean)
    : typeof service.amenities === 'string' 
      ? (service.amenities as string).split(',').map((a: string) => a.trim().toLowerCase()) 
      : [];

  return requestedAmenities.every(req => sAmenities.includes(req.toLowerCase()));
}
