import { supabase } from '../lib/supabase';

/**
 * Bulk sync services from Excel data
 * @param {Array} servicesData - Array of service objects from Excel
 * @returns {Promise<Object>} - Result of the operation
 */
export const bulkSyncServices = async (servicesData) => {
  if (!servicesData || servicesData.length === 0) {
    throw new Error('No service data provided for import.');
  }

  // Map and sanitize data to match Supabase schema
  const sanitizedServices = servicesData.map(service => {
    // Basic fields
    const sanitized = {
      name: service.name,
      description: service.description || '',
      location: service.location || '',
      region: service.region || '',
      // base_price: service.price ? Number(service.price) : 0, // DECOMMISSIONED
      service_type: service.service_type || 'activity',
      duration_hours: service.duration_hours ? parseInt(service.duration_hours, 10) : null,
      duration_days: service.duration_days ? parseInt(service.duration_days, 10) : null,
      image_url: service.image_url || '',
      status: service.status || 'In Stock',
      stock: service.stock ? parseInt(service.stock, 10) : 100,
      featured: service.featured === 'true' || service.featured === true || false,
    };

    // Handle amenities (Excel might have them as comma separated string)
    if (service.amenities) {
      if (typeof service.amenities === 'string') {
        sanitized.amenities = service.amenities.split(',').map(a => a.trim()).filter(Boolean);
      } else if (Array.isArray(service.amenities)) {
        sanitized.amenities = service.amenities;
      }
    }

    // Default JSON fields if not provided
    sanitized.room_types = service.room_types ? (typeof service.room_types === 'string' ? JSON.parse(service.room_types) : service.room_types) : [];
    sanitized.itinerary = service.itinerary ? (typeof service.itinerary === 'string' ? JSON.parse(service.itinerary) : service.itinerary) : [];
    sanitized.highlights = service.highlights ? (typeof service.highlights === 'string' ? JSON.parse(service.highlights) : service.highlights) : [];

    return sanitized;
  });

  // Perform bulk insert
  // Note: upsert based on 'name' or use simple 'insert'? 
  // User asked to "populate", usually implying insert. 
  // We'll use insert. If name conflict is a concern, we can add it to onConflict.
  const { data, error } = await supabase
    .from('services')
    .insert(sanitizedServices)
    .select();

  if (error) {
    console.error('Bulk Import Error:', error);
    throw new Error(`Failed to import services: ${error.message}`);
  }

  return data;
};
