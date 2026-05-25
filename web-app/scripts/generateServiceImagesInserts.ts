import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.');
  console.error(`Supabase URL: ${supabaseUrl ? 'Present' : 'Missing'}`);
  console.error(`Supabase Key: ${supabaseKey ? 'Present' : 'Missing'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Service {
  id: string;
  name: string;
  service_type: string;
  location: string;
  image_url: string;
  rating: number;
}

async function fetchServicesNeedingPhotos() {
  try {
    console.log('Fetching services that need new photos...');
    
    const { data, error } = await supabase
      .from('services')
      .select('id, name, service_type, location, image_url, rating')
      .or('image_url.eq./hero-hotel.png,image_url.eq./hero-adventure.png,image_url.ilike.%/placeholders/%,image_url.ilike.%/assets/hero/%')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching services: ${error.message}`);
    }

    if (!data) {
      console.log('No services found needing new photos.');
      return [];
    }

    console.log(`Found ${data.length} services needing new photos.`);
    return data as Service[];
  } catch (error) {
    console.error('Failed to fetch services:', error);
    throw error;
  }
}

/**
 * Generates a Google Images search URL for a given service
 */
function generateGoogleSearchUrl(serviceName: string, serviceType: string): string {
  const searchTerm = `${serviceName} ${serviceType}`;
  const encodedTerm = encodeURIComponent(searchTerm);
  return `https://www.google.com/search?q=${encodedTerm}&tbm=isch`;
}

/**
 * Generates SQL INSERT statements for service_images table
 */
function generateServiceImagesInserts(services: Service[]): void {
  console.log('\n--- SERVICE_IMAGES INSERT STATEMENTS ---\n');
  console.log('-- Copy and paste the following SQL statements into your database management tool');
  console.log('-- Replace the placeholder URLs with actual image URLs you find\n');
  
  services.forEach((service, index) => {
    console.log(`-- ${index + 1}. ${service.name} (${service.service_type}) - ${service.location}`);
    console.log(`-- Search: ${generateGoogleSearchUrl(service.name, service.service_type)}\n`);
    
    // Generate INSERT statements for 3 images per service
    for (let i = 1; i <= 3; i++) {
      const isPrimary = i === 1 ? 'true' : 'false';
      const displayOrder = i;
      
      console.log(`-- INSERT for image ${i}`);
      console.log(`-- Replace 'https://example.com/path-to-image-${i}.jpg' with actual image URL`);
      console.log(`INSERT INTO service_images (service_id, image_url, is_primary, display_order) VALUES ('${service.id}', 'https://example.com/path-to-image-${i}.jpg', ${isPrimary}, ${displayOrder});`);
    }
    
    console.log(''); // Empty line for readability
  });
  
  console.log('\n-- INSTRUCTIONS:');
  console.log('-- 1. Visit each search link to find 3 appropriate images for the service');
  console.log('-- 2. Replace the placeholder URLs with actual image URLs you find');
  console.log('-- 3. Make sure the first image has is_primary=true');
  console.log('-- 4. Execute the SQL statements in your database management tool');
}

async function main() {
  try {
    const services = await fetchServicesNeedingPhotos();
    
    if (services.length === 0) {
      console.log('No services need new photos.');
      return;
    }
    
    generateServiceImagesInserts(services);
    
    console.log(`\nGenerated INSERT templates for ${services.length} services with 3 images each.`);
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
main();

export { fetchServicesNeedingPhotos };
export type { Service };