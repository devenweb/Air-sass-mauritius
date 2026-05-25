import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateLeadPrice } from '../utils/pricingUtils';

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  media_type: string;
  cta_text?: string;
  cta_link?: string;
  badge_text?: string;
  badge_color?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  link: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  lowestPrice: number;
  price: number;      // mapped for UI
  image_url: string;
  service_type: string; // Actual column name
  category: string;     // mapped for UI
  location?: string;
  amenities?: string[];
  itinerary?: { day?: string; time?: string; title: string; description: string }[];
  gallery_images?: string[];
  room_types?: any[]; // JSON column
  max_group_size?: number;
  max_adults?: number;
  cancellation_policy?: string;
  terms_and_conditions?: string;
  included?: string[] | string;
  not_included?: string[] | string;
  special_features?: string[] | string;
  highlights?: string[] | string;
  duration_days?: number;
  duration_hours?: number;
  banner_url?: string;
  rating?: number;
  meal_plans?: string[];
  secondary_image_url?: string;
  activity_type?: string;
  is_seasonal?: boolean;
  deal_note?: string;
  short_description?: string;
};
/* PREVIOUS PROPERTIES PRESERVED AS COMMENT PER USER RULES:
  rating?: number;
  meal_plans?: string[];
  secondary_image_url?: string;
};
*/

export const useHomeData = () => {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [destinations, setDestinations] = useState<{name: string, image: any, query: string}[]>([]);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        // PERF-3 fix: Run all 4 queries in parallel (was sequential — 4 round-trips → 1)
        const [
          { data: slides, error: slidesError },
          { data: cats, error: catsError },
          { data: services, error: servicesError },
          { data: regionData, error: regionError }
        ] = await Promise.all([
          supabase.from('hero_slides').select('*').order('order_index', { ascending: true }),
          supabase.from('categories').select('*').order('display_order', { ascending: true, nullsFirst: false }),
          supabase.from('services').select('*, service_pricing(price, occupancy_pricing), service_categories(categories(name))').order('priority', { ascending: false }).order('created_at', { ascending: false }).limit(10),
          supabase.from('services').select('region').not('region', 'is', null)
        ]);
        
        if (slidesError) {
          console.error('Supabase error (hero_slides):', slidesError);
          throw slidesError;
        }
        if (catsError) {
          console.error('Supabase error (categories):', catsError);
          throw catsError;
        }
        if (servicesError) {
          console.error('Supabase error (services):', servicesError);
          throw servicesError;
        }

        const mappedServices = (services || []).map((s: any) => {
          const categoryName = s.service_categories?.[0]?.categories?.name || s.service_type || 'Experience';
          const lowestPrice = calculateLeadPrice(s.service_pricing || [], s.service_type);
          return { ...s, price: lowestPrice, lowestPrice, category: categoryName };
        });

        if (!regionError && regionData) {
          const uniqueRegions = [...new Set((regionData as {region: string}[]).map(r => r.region))];
          const mappedDestinations = uniqueRegions.slice(0, 5).map(region => ({
            name: region.toUpperCase(),
            query: region,
            // Use local app icon as fallback — api.placeholder.com is an invalid/dead URL
            image: require('../../assets/icon.png')
          }));
          setDestinations(mappedDestinations);
        }

        setHeroSlides(slides || []);
        setCategories(cats || []);
        setFeaturedServices(mappedServices);
      } catch (err: any) {
        console.error('Home Data Error:', err.message || err);
        setError(err.message || 'An error occurred while loading home data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return { heroSlides, categories, destinations, featuredServices, isLoading, error };
};
