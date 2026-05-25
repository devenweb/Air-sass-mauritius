import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Service } from './useHomeData';
import { calculateLeadPrice } from '../utils/pricingUtils';

export const useSearchServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchServices = useCallback(async (query: string, categorySlug: string | null = null, region: string | null = null) => {
    // FIX-3: Debounce — clear any pending timer, wait 300ms before firing
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        let dbCategorySlug = categorySlug;
        let activityTypeFilter: string | null = null;

        if (categorySlug === 'activities-land') {
          dbCategorySlug = 'activities';
          activityTypeFilter = 'Land';
        } else if (categorySlug === 'activities-sea') {
          dbCategorySlug = 'activities';
          activityTypeFilter = 'Sea';
        }

        let selectString = '*, service_pricing(price, occupancy_pricing), service_categories(categories(id, name, slug))';

        // Use !inner joins when filtering by category to ensure the main records are filtered
        if (dbCategorySlug && dbCategorySlug !== 'all') {
          selectString = '*, service_pricing(price, occupancy_pricing), service_categories!inner(categories!inner(id, name, slug))';
        }

        let supabaseQuery = supabase
          .from('services')
          .select(selectString)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });

        if (query) {
          supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
        }

        if (region && region !== 'All') {
          supabaseQuery = supabaseQuery.ilike('location', `%${region}%`);
        }

        if (dbCategorySlug && dbCategorySlug !== 'all') {
          supabaseQuery = supabaseQuery.eq('service_categories.categories.slug', dbCategorySlug);
        }

        if (activityTypeFilter) {
          supabaseQuery = supabaseQuery.eq('activity_type', activityTypeFilter);
        }

        const { data, error: searchError } = await supabaseQuery;

        if (searchError) throw searchError;

        const mappedServices = (data || []).map((s: any) => {
          // Extract category name from the join if available
          const categoryName = s.service_categories?.[0]?.categories?.name || s.service_type || 'Experience';
          const lowestPrice = calculateLeadPrice(s.service_pricing || [], s.service_type);

          return {
            ...s,
            price: lowestPrice,
            lowestPrice: lowestPrice,
            category: categoryName,
          };
        });

        setServices(mappedServices);
      } catch (err: any) {
        console.error('Search Error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  // Clean up timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { services, isLoading, error, searchServices };
};
