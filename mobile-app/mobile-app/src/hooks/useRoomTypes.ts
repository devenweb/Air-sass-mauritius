import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RoomType {
  id: string;
  name: string;
  weekday_price: number;
  weekend_price: number;
  image_url?: string;
  amenities?: string[];
  meal_plan?: string;
  min_stay?: number;
  max_adults?: number;
  max_children?: number;
  max_teens?: number;
  max_infants?: number;
  description?: string;
}

export const useRoomTypes = (serviceId: string | undefined, skip = false) => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FIX-4: Skip DB call if caller signals rooms are already available (JSONB column)
    if (!serviceId || skip) return;

    const fetchRoomTypes = async () => {
      try {
        setLoading(true);
        const { data, error: roomError } = await supabase
          .from('room_types')
          .select('*')
          .eq('service_id', serviceId);

        if (roomError) throw roomError;
        setRoomTypes(data || []);
      } catch (err: any) {
        console.error('Error fetching room types:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomTypes();
  }, [serviceId, skip]);

  return { roomTypes, loading, error };
};

