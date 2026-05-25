import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ServicePricingRequest {
  serviceId: string;
  variantId?: string; // Room Type UUID or 'default'
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  participants: {
    adults: number;
    teens: number;
    children: number;
    infants: number;
  };
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
}

export interface MealOption {
  label: string;
  total: number;
  dailyRates: any[];
  mealPlanId?: string;
}

export const useServicePricing = (req: ServicePricingRequest | null) => {
  const [pricing, setPricing] = useState<CalculatedPricing | null>(null);
  const [mealOptions, setMealOptions] = useState<MealOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!req || !req.serviceId || !req.startDate || !req.endDate) {
      setPricing(null);
      setMealOptions([]);
      setLoading(false); // Ensure loader clears if req becomes invalid
      return;
    }

    const calculate = async () => {
      try {
        setLoading(true);
        setError(null);
        // console.log('--- Starting Pricing Calculation ---');
        // console.log('Request:', JSON.stringify(req));

        const { serviceId, variantId, startDate, endDate, participants, baseRates, isPerNight: reqIsPerNight } = req;
        
        // console.log('Fetching pricing data from Supabase...');
        
        const baseQuery = supabase
          .from('service_pricing')
          .select('*')
          .eq('service_id', serviceId)
          .gte('date_to', startDate)
          .lte('date_from', endDate);

        if (!variantId || variantId === 'default') {
          baseQuery.is('variant_id', null);
        } else {
          baseQuery.eq('variant_id', variantId);
        }

        const [overridesRes, supplementsRes, absRes, serviceRes] = await Promise.all([
          baseQuery,
          supabase
            .from('service_pricing')
            .select('*')
            .eq('service_id', serviceId)
            .eq('label', 'Supplement')
            .gte('date_to', startDate)
            .lte('date_from', endDate),
          variantId && variantId !== 'default' ? supabase
            .from('service_pricing')
            .select('*, meal_plan_id')
            .eq('service_id', serviceId)
            .eq('variant_id', variantId)
            .not('meal_plan_id', 'is', null) : Promise.resolve({ data: null, error: null }),
          supabase
            .from('services')
            .select('meal_plans')
            .eq('id', serviceId)
            .single()
        ]);

        // console.log('Data fetched. Processing results...');

        if (overridesRes.error) throw overridesRes.error;
        const overrides = overridesRes.data || [];

        const start = new Date(startDate);
        const end = new Date(endDate);
        const dailyRates: DailyRate[] = [];
        
        let totalAdults = 0;
        let totalTeens = 0;
        let totalChildren = 0;
        let totalInfants = 0;

        const loopEnd = startDate === endDate ? new Date(new Date(endDate).getTime() + 86400000) : end;
        const nights = Math.max(1, Math.ceil((loopEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        let priceAdded = false;
        for (let d = new Date(start); d < loopEnd; d.setDate(d.getDate() + 1)) {
          const currentDateStr = d.toISOString().split('T')[0];
          
          const activePricing = overrides?.find(o => 
            currentDateStr >= o.date_from && currentDateStr <= o.date_to
          );

          // Deep Search Parity: Handle occupancy-based pricing (JSONB)
          let adultRate = activePricing ? Number(activePricing.price) : baseRates.adult;
          let teenRate = activePricing ? Number(activePricing.price_teen) : baseRates.teen;
          let childRate = activePricing ? Number(activePricing.price_child) : baseRates.child;
          let infantRate = activePricing ? Number(activePricing.price_infant) : baseRates.infant;

          const occ = activePricing?.occupancy_pricing;
          if (occ && typeof occ === 'object') {
            const numAdults = participants.adults || 1;
            const tierData = occ[numAdults.toString()] ?? occ[numAdults];
            if (tierData !== undefined && tierData !== null) {
              if (typeof tierData === 'object') {
                adultRate = Number(tierData.price || 0);
                if (tierData.teen !== undefined) teenRate = Number(tierData.teen);
                if (tierData.child !== undefined) childRate = Number(tierData.child);
                if (tierData.infant !== undefined) infantRate = Number(tierData.infant);
              } else {
                adultRate = Number(tierData);
              }
            }
          }

          const isPerNight = activePricing ? activePricing.price_type === 'per_night' : !!reqIsPerNight;

          const rates: DailyRate = {
            date: currentDateStr,
            adult: adultRate,
            teen: teenRate,
            child: childRate,
            infant: infantRate,
            source: activePricing ? 'grid' : 'base',
            is_stop_sell: !!activePricing?.is_stop_sell
          };

          dailyRates.push(rates);
          
          if (isPerNight) {
            totalAdults += rates.adult; // Room price
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

        setPricing({
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
          }
        });

        // Calculate Dynamic Meal Options for Parity
        const supplements = supplementsRes.data || [];
        const absoluteRecords = absRes.data || [];
        const serviceMealPlans = serviceRes.data?.meal_plans || [];
        const computedMealOptions: MealOption[] = [];

        // Additive supplements
        const supplementLabels = Array.from(new Set(supplements.map(r => r.label).filter(Boolean)));
        supplementLabels.forEach(label => {
          let mealTotal = 0;
          const dailyDetails: any[] = [];
          for (let d = new Date(start); d < loopEnd; d.setDate(d.getDate() + 1)) {
            const currentDateStr = d.toISOString().split('T')[0];
            const active = supplements.find(r => r.label === label && r.date_from <= currentDateStr && r.date_to >= currentDateStr);
            const rRates = {
              adult: active ? Number(active.price || 0) : 0,
              teen: active ? Number(active.price_teen || 0) : 0,
              child: active ? Number(active.price_child || 0) : 0,
              infant: active ? Number(active.price_infant || 0) : 0,
            };
            mealTotal += (rRates.adult * participants.adults) + (rRates.teen * (participants.teens || 0)) + (rRates.child * (participants.children || 0)) + (rRates.infant * (participants.infants || 0));
            dailyDetails.push(rRates);
          }
          computedMealOptions.push({ label: label as string, total: mealTotal, dailyRates: dailyDetails });
        });

        // Absolute records delta calculation
        const absoluteIds = Array.from(new Set(absoluteRecords.map(r => r.meal_plan_id).filter(Boolean)));
        let basePricingRecords: any[] = [];
        if (absoluteIds.length > 0) {
          const { data: bpData } = await supabase
            .from('service_pricing')
            .select('*')
            .eq('service_id', serviceId)
            .eq('variant_id', variantId)
            .is('meal_plan_id', null);
          basePricingRecords = bpData || [];
        }

        for (const mpId of absoluteIds) {
          const planDef = serviceMealPlans.find((p: any) => p.id === mpId);
          if (!planDef) continue;

          let mealTotal = 0;
          const dailyDetails: any[] = [];
          const adultCount = participants.adults || 2;

          for (let d = new Date(start); d < loopEnd; d.setDate(d.getDate() + 1)) {
            const currentDateStr = d.toISOString().split('T')[0];
            const activeAbs = absoluteRecords.find(r => r.meal_plan_id === mpId && r.date_from <= currentDateStr && r.date_to >= currentDateStr);
            const activeBase = basePricingRecords.find(r => r.date_from <= currentDateStr && r.date_to >= currentDateStr);

            const getTierPrice = (pricingRec: any) => {
              if (!pricingRec) return 0;
              const occ = pricingRec.occupancy_pricing;
              if (occ && typeof occ === 'object') {
                const tier = occ[adultCount.toString()] ?? occ[adultCount];
                if (tier !== undefined && tier !== null) {
                  return Number(typeof tier === 'object' ? (tier.price || 0) : tier);
                }
              }
              return Number(pricingRec.price || 0);
            };

            const absPrice = getTierPrice(activeAbs);
            const basePrice = getTierPrice(activeBase);

            const rRates = {
              adult: activeAbs ? Math.max(0, absPrice - basePrice) : 0,
              teen: activeAbs ? Math.max(0, Number(activeAbs.price_teen || 0) - (activeBase ? Number(activeBase.price_teen || 0) : 0)) : 0,
              child: activeAbs ? Math.max(0, Number(activeAbs.price_child || 0) - (activeBase ? Number(activeBase.price_child || 0) : 0)) : 0,
              infant: activeAbs ? Math.max(0, Number(activeAbs.price_infant || 0) - (activeBase ? Number(activeBase.price_infant || 0) : 0)) : 0,
            };

            mealTotal += (rRates.adult * participants.adults) + (rRates.teen * (participants.teens || 0)) + (rRates.child * (participants.children || 0)) + (rRates.infant * (participants.infants || 0));
            dailyDetails.push(rRates);
          }

          if (!computedMealOptions.find(res => res.label === planDef.label)) {
            computedMealOptions.push({ label: planDef.label, total: mealTotal, dailyRates: dailyDetails, mealPlanId: mpId as string });
          }
        }

        setMealOptions(computedMealOptions);
      } catch (err: any) {
        console.error('Pricing calculation error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    calculate();
  }, [req]);

  return { pricing, mealOptions, loading, error };
};

/* PREVIOUS IMPLEMENTATION PRESERVED AS COMMENTS PER USER RULES:
export const useServicePricing = (req: ServicePricingRequest | null) => {
  const [pricing, setPricing] = useState<CalculatedPricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // calculation logic...
  }, [req]);

  return { pricing, loading, error };
};
*/


