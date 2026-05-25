import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Service } from './useHomeData';
import { calculateLeadPrice } from '../utils/pricingUtils';

export const useServiceDetails = (id: string | string[] | undefined) => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchService = async () => {
      try {
        setIsLoading(true);
        const { data, error: serviceError } = await supabase
          .from('services')
          .select('*, amenities, itinerary, gallery_images, service_pricing(price, price_teen, price_child, price_infant, net_price, net_price_teen, net_price_child, net_price_infant, occupancy_pricing), service_categories(categories(name))')
          .eq('id', id)
          .single();

        if (serviceError) throw serviceError;
        
        if (data) {
          // Extract category name from the join if available
          const categoryName = data.service_categories?.[0]?.categories?.name || data.service_type || 'Experience';
          const pricing = data.service_pricing || [];
          const lowestPrice = calculateLeadPrice(pricing, data.service_type);
          const primaryPricing = pricing.find((p: any) => !p.variant_id);

          setService({
            ...data,
            price: lowestPrice,
            lowestPrice: lowestPrice,
            price_teen: primaryPricing?.price_teen || data.price_teen,
            price_child: primaryPricing?.price_child || data.price_child,
            price_infant: primaryPricing?.price_infant || data.price_infant,
            category: categoryName
          });
        }
      } catch (err: any) {
        console.error('Error fetching service details:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [id]);

  return { service, isLoading, error };
};
