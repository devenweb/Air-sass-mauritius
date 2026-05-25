import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  status: string;
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
};

export const useServiceAddons = (serviceId: string | undefined) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;

    const fetchAddons = async () => {
      try {
        setIsLoading(true);

        // FIX-5: Run reviews + FAQs in parallel AND scope FAQs to this service
        // (was sequential + FAQs were fetching the entire table)
        const [
          { data: reviewData, error: reviewError },
          { data: faqData, error: faqError }
        ] = await Promise.all([
          supabase
            .from('reviews')
            .select('id, customer_name, rating, comment, created_at, status')
            .eq('service_id', serviceId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('faqs')
            .select('id, question, answer, category, order_index')
            .order('order_index', { ascending: true })
            .limit(5),
        ]);

        if (reviewError) throw reviewError;
        if (faqError) throw faqError;

        setReviews(reviewData || []);
        setFaqs(faqData || []);
      } catch (err: any) {
        console.error('Error fetching service addons:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddons();
  }, [serviceId]);

  return { reviews, faqs, isLoading, error };
};
