import { createClient } from './supabase';

const supabase = createClient();

export interface ServicePricingRequest {
  serviceId: string;
  variantId?: string; // Room Type UUID or 'default'
  startDate: string; // ISO Date
  endDate: string;   // ISO Date
  participants: {
    adults: number;
    teens: number;
    children: number;
    infants: number;
  };
  mealPlanId?: string; // Optional: for absolute pricing per meal plan
  baseRates: {
    adult: number;
    teen: number;
    child: number;
    infant: number;
  };
  isPerNight?: boolean;
}

export interface DailyRate {
  date: string;
  adult: number;
  teen: number;
  child: number;
  infant: number;
  source: 'grid' | 'base';
  units_available?: number | null;
  is_stop_sell?: boolean;
}

export interface CalculatedPricing {
  dailyRates: DailyRate[];
  total: number;
  totalPerCategory: {
    adults: number;
    teens: number;
    children: number;
    infants: number;
  };
  nights: number;
  availabilityStatus: {
    isAvailable: boolean;
    reason?: string;
  };
  mealPlanId?: string;
}

/**
 * Calculates total pricing for a service stay/experience.
 * Fallback Logic: Grid Override -> Base Rates
 */
export async function calculateServicePricing(req: ServicePricingRequest): Promise<CalculatedPricing> {
  const { serviceId, variantId, startDate, endDate, participants, baseRates, isPerNight: reqIsPerNight } = req;
  
  // Fetch service details to determine correct pricing engine model (hotel vs activity)
  const { data: serviceDetails } = await supabase
    .from('services')
    .select('service_type')
    .eq('id', serviceId)
    .single();
  const isHotel = serviceDetails?.service_type === 'hotel';
  
  // Fetch potential overrides for this service
  // We fetch ALL variants at once to allow memory-side filtering if needed, 
  // but for a single calculation we filter by variantId.
  const query = supabase
    .from('service_pricing')
    .select('*')
    .eq('service_id', serviceId)
    .gte('date_to', startDate)
    .lte('date_from', endDate);

  // Fetch records ONLY for the specific variant requested
  if (variantId && variantId !== 'default') {
    query.eq('variant_id', variantId);
  } else {
    query.is('variant_id', null);
  }

  // Support absolute meal plan pricing if requested
  /* OLD IMPLEMENTATION - COMMENTED OUT TO ENSURE NO REGRESSIONS AND PRESERVE HISTORY
  if (req.mealPlanId && req.mealPlanId !== 'none') {
    query.eq('meal_plan_id', req.mealPlanId);
  } else {
    query.is('meal_plan_id', null);
  }
  */
  if (req.mealPlanId && req.mealPlanId !== 'none') {
    query.or(`meal_plan_id.eq.${req.mealPlanId},meal_plan_id.is.null`);
  } else {
    query.is('meal_plan_id', null);
  }

  const { data: overrides, error } = await query;

  if (error) {
    console.error('Error fetching service pricing overrides:', error);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const dailyRates: CalculatedPricing['dailyRates'] = [];
  
  let totalAdults = 0;
  let totalTeens = 0;
  let totalChildren = 0;
  let totalInfants = 0;

  // Standard N-Night Hotel behavior (exclusive of end date)
  // For single day activities, the loop should run at least once
  const loopEnd = startDate === endDate ? new Date(new Date(endDate).getTime() + 86400000) : end;
  const nights = Math.max(1, Math.ceil((loopEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  let priceAdded = false;
  for (let d = new Date(start); d < loopEnd; d.setDate(d.getDate() + 1)) {
    const currentDateStr = d.toISOString().split('T')[0];
    
    // Find the most specific override for this date
    /* OLD IMPLEMENTATION - COMMENTED OUT TO ENSURE NO REGRESSIONS AND PRESERVE HISTORY
    const activePricing = overrides?.find((r: any) => r.date_from <= currentDateStr && r.date_to >= currentDateStr);
    */
    const activePricing = (req.mealPlanId && req.mealPlanId !== 'none')
      ? (overrides?.find((r: any) => r.date_from <= currentDateStr && r.date_to >= currentDateStr && r.meal_plan_id === req.mealPlanId)
         || overrides?.find((r: any) => r.date_from <= currentDateStr && r.date_to >= currentDateStr && !r.meal_plan_id))
      : overrides?.find((r: any) => r.date_from <= currentDateStr && r.date_to >= currentDateStr);

    const rates: DailyRate = {
      date: currentDateStr,
      adult: (activePricing && Number(activePricing.price) > 0) ? Number(activePricing.price) : baseRates.adult,
      teen: (activePricing && Number(activePricing.price_teen) > 0) ? Number(activePricing.price_teen) : baseRates.teen,
      child: (activePricing && Number(activePricing.price_child) > 0) ? Number(activePricing.price_child) : baseRates.child,
      infant: (activePricing && Number(activePricing.price_infant) > 0) ? Number(activePricing.price_infant) : baseRates.infant,
      source: activePricing ? 'grid' : 'base',
      units_available: activePricing ? activePricing.units_available : null,
      is_stop_sell: !!activePricing?.is_stop_sell,
    };

    // Enforce per_person pricing for non-hotel services
    const isPerNight = isHotel && (activePricing ? activePricing.price_type === 'per_night' : !!reqIsPerNight);

    // Deep Search Parity: Resolve occupancy-based pricing for all service types
    const adultCount = participants.adults || 1;
    let occData = activePricing?.occupancy_pricing?.[adultCount] || activePricing?.occupancy_pricing?.[String(adultCount)];
    
    // Fallback: search for keys starting with the adult count (e.g. "1_adult")
    if (!occData && activePricing?.occupancy_pricing) {
      const keys = Object.keys(activePricing.occupancy_pricing);
      const matchingKey = keys.find(k => k === String(adultCount) || k.startsWith(`${adultCount}_`));
      if (matchingKey) {
        occData = activePricing.occupancy_pricing[matchingKey];
      }
    }
    
    if (occData && typeof occData === 'object') {
      // New structure: { price: X, teen: Y, child: Z, infant: I }
      rates.adult = Number(occData.price || 0);
      rates.teen = Number(occData.teen ?? rates.teen);
      rates.child = Number(occData.child ?? rates.child);
      rates.infant = Number(occData.infant ?? rates.infant);
    } else if (occData) {
      // Legacy support: occupancy_pricing[adultCount] was just a number
      rates.adult = Number(occData);
    }

    // CRITICAL SAFETY: If the calculated price for this date is 0 but we have a valid lead price,
    // fallback to the lead price to prevent "MUR 0" regressions.
    if (rates.adult === 0 && baseRates.adult > 0) {
      rates.adult = baseRates.adult;
    }

    dailyRates.push(rates);
    
    if (isPerNight) {
      totalAdults += rates.adult; // In per_night mode, rates.adult is the room price
      // Supplements (Teens/Children) are still additive
      totalTeens += rates.teen * (participants.teens || 0);
      totalChildren += rates.child * (participants.children || 0);
      totalInfants += rates.infant * (participants.infants || 0);
    } else if (!priceAdded) {
      totalAdults += rates.adult * (participants.adults || 0);
      totalTeens += rates.teen * (participants.teens || 0);
      totalChildren += rates.child * (participants.children || 0);
      totalInfants += rates.infant * (participants.infants || 0);
      priceAdded = true;
    }
  }

  return {
    dailyRates,
    total: totalAdults + totalTeens + totalChildren + totalInfants,
    totalPerCategory: {
      adults: totalAdults,
      teens: totalTeens,
      children: totalChildren,
      infants: totalInfants,
    },
    nights,
    availabilityStatus: {
      isAvailable: !dailyRates.some(r => r.is_stop_sell),
      reason: dailyRates.some(r => r.is_stop_sell) ? 'STOP_SELL' : undefined
    },
    mealPlanId: req.mealPlanId
  };
}

export interface MealOption {
  label: string;
  total: number;
  dailyRates: any[];
  mealPlanId?: string;
}

/**
 * Calculations for additive meal supplements based on dates and ages.
 */
export async function calculateMealPricing(
  serviceId: string, 
  startDate: string, 
  endDate: string,
  participants: ServicePricingRequest['participants'],
  variantId?: string
): Promise<MealOption[]> {
  // 1. Fetch Additive Supplements
  const { data: supplements } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('service_id', serviceId)
    .eq('variant_id', 'meal_supplements');

  // 2. Fetch Absolute Meal Plan Rates (if variant selected)
  let absoluteRecords: any[] = [];
  if (variantId && variantId !== 'default') {
    const { data: abs } = await supabase
      .from('service_pricing')
      .select('*, meal_plan_id')
      .eq('service_id', serviceId)
      .eq('variant_id', variantId)
      .not('meal_plan_id', 'is', null);
    absoluteRecords = abs || [];
  }

  const allRecords = [...(supplements || []), ...absoluteRecords];
  if (allRecords.length === 0) return [];

  // Get labels for absolute records from the service definition
  const { data: service } = await supabase
    .from('services')
    .select('meal_plans')
    .eq('id', serviceId)
    .single();

  const mealPlans = service?.meal_plans || [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const loopEnd = startDate === endDate ? new Date(new Date(endDate).getTime() + 86400000) : end;
  
  // Identify all unique meal plans (by label or ID)
  const supplementLabels = Array.from(new Set(supplements?.map((r: any) => r.label) || []));
  const absoluteIds = Array.from(new Set(absoluteRecords.map((r: any) => r.meal_plan_id)));
  
  const results: MealOption[] = [];

  // Add additive supplements
  supplementLabels.forEach((label: any) => {
    let mealTotal = 0;
    const dailyDetails: any[] = [];

    for (let d = new Date(start); d < loopEnd; d.setDate(d.getDate() + 1)) {
      const currentDateStr = d.toISOString().split('T')[0];
      const active = supplements?.find((r: any) => r.label === label && r.date_from <= currentDateStr && r.date_to >= currentDateStr);

      const r = {
        adult:  active ? Number(active.price) : 0,
        teen:   active ? Number(active.price_teen) : 0,
        child:  active ? Number(active.price_child) : 0,
        infant: active ? Number(active.price_infant) : 0,
      };

      mealTotal += (r.adult * participants.adults) + (r.teen * participants.teens) + (r.child * participants.children) + (r.infant * participants.infants);
      dailyDetails.push(r);
    }
    results.push({ label: label!, total: mealTotal, dailyRates: dailyDetails });
  });

  // Add absolute meal plan options (calculating the delta relative to base)
  for (const mpId of absoluteIds) {
    const planDef = mealPlans.find((p: any) => p.id === mpId);
    if (!planDef) continue;

    // Fetch base pricing (no meal plan) for this variant to calculate the supplement delta
    const { data: basePricing } = await supabase
      .from('service_pricing')
      .select('*')
      .eq('service_id', serviceId)
      .eq('variant_id', variantId)
      .is('meal_plan_id', null);

    let mealTotal = 0;
    const dailyDetails: any[] = [];

    for (let d = new Date(start); d < loopEnd; d.setDate(d.getDate() + 1)) {
      const currentDateStr = d.toISOString().split('T')[0];
      // Get current adult count to find correct tier
      const adultCount = participants.adults || 2;
      
      const activeAbs = absoluteRecords.find((r: any) => r.meal_plan_id === mpId && r.date_from <= currentDateStr && r.date_to >= currentDateStr);
      const activeBase = basePricing?.find((r: any) => r.date_from <= currentDateStr && r.date_to >= currentDateStr);

      const getTierPrice = (pricing: any) => {
        if (!pricing) return 0;
        const occ = pricing.occupancy_pricing;
        if (occ && (occ[adultCount] || occ[String(adultCount)])) {
          const tier = occ[adultCount] || occ[String(adultCount)];
          return Number(typeof tier === 'object' ? (tier.price || 0) : tier);
        }
        return Number(pricing.price || 0);
      };

      const absPrice = getTierPrice(activeAbs);
      const basePrice = getTierPrice(activeBase);

      const r = {
        adult: activeAbs ? (absPrice - basePrice) : 0,
        teen: activeAbs ? (Number(activeAbs.price_teen || 0) - (activeBase ? Number(activeBase.price_teen || 0) : 0)) : 0,
        child: activeAbs ? (Number(activeAbs.price_child || 0) - (activeBase ? Number(activeBase.price_child || 0) : 0)) : 0,
        infant: activeAbs ? (Number(activeAbs.price_infant || 0) - (activeBase ? Number(activeBase.price_infant || 0) : 0)) : 0,
      };

      mealTotal += (r.adult * participants.adults) + (r.teen * participants.teens) + (r.child * participants.children) + (r.infant * participants.infants);
      dailyDetails.push(r);
    }
    
    // Only add if not already present as a supplement
    if (!results.find(res => res.label === planDef.label)) {
      results.push({ label: planDef.label, total: mealTotal, dailyRates: dailyDetails });
    }
  }

  return results;
}
/**
 * Fetches all stop dates (is_stop_sell = true) for a specific service/variant.
 * Uses parseISO to prevent UTC timezone drift (critical for users in UTC+ timezones).
 */
export async function getStopDates(serviceId: string, variantId?: string): Promise<Date[]> {
  const query = supabase
    .from('service_pricing')
    .select('date_from, date_to')
    .eq('service_id', serviceId)
    .eq('is_stop_sell', true);

  if (!variantId || variantId === 'default') {
    query.is('variant_id', null);
  } else {
    query.eq('variant_id', variantId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching stop dates:', error);
    return [];
  }

  const stopDates: Date[] = [];
  data.forEach((record: any) => {
    try {
      // Use explicit year/month/day parsing to avoid UTC timezone drift
      const [fy, fm, fd] = record.date_from.split('-').map(Number);
      const [ty, tm, td] = record.date_to.split('-').map(Number);
      const start = new Date(fy, fm - 1, fd);
      const end = new Date(ty, tm - 1, td);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        stopDates.push(new Date(d));
      }
    } catch (e) {
      console.error('Error parsing stop date record:', record, e);
    }
  });

  return stopDates;
}

