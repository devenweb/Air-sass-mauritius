import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type Booking = {
  id: string;
  customer_id: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | string;
  created_at: string;
  service_name: string;
  total_amount: number;
  service_type: string;
  service_id?: string;
  image_url?: string;
  location?: string;
};

export const useCustomerBookings = () => {
  const { session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        
        // Step 1: Get the customer record for this auth user
        const { data: customer, error: customerErr } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (customerErr && customerErr.code !== 'PGRST116') throw customerErr;
        
        if (!customer) {
            setBookings([]);
            setIsLoading(false);
            return;
        }

        // Step 2: Fetch bookings and join with booking_items -> services for imagery
        const { data, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            customer_id,
            status,
            created_at,
            service_name,
            total_amount,
            service_type,
            booking_items(
              service_id,
              services(
                image_url,
                location
              )
            )
          `)
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        // Map the complicated join down to the clean Booking type for the UI
        const mappedBookings: Booking[] = (data || []).map((booking: any) => {
          const firstItem = booking.booking_items?.[0];
          return {
            id: booking.id,
            customer_id: booking.customer_id,
            status: booking.status,
            created_at: booking.created_at,
            service_name: booking.service_name,
            total_amount: booking.total_amount,
            service_type: booking.service_type,
            service_id: firstItem?.service_id || undefined,
            image_url: firstItem?.services?.image_url || undefined,
            location: firstItem?.services?.location || 'Mauritius',
          };
        });

        setBookings(mappedBookings);
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [session?.user]);

  return { bookings, isLoading, error };
};
