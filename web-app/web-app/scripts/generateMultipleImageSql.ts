import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

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
 * Generates a template SQL UPDATE statement for a service with multiple images
 * Note: This assumes you want to store multiple images in a JSONB column or similar
 */
function generateUpdateStatementWithMultipleImages(
  serviceId: string, 
  primaryImage: string, 
  additionalImages: string[],
  serviceName: string
): string {
  // Create a JSON array of image URLs
  // const allImages = [primaryImage, ...additionalImages]; // Unused
  
  // If your services table doesn't have a separate gallery column,
  // we'll update the main image_url to the primary image
  // and provide additional info about the other images
  
  let sql = `-- Update for: ${serviceName}\n`;
  sql += `-- Primary image: ${primaryImage}\n`;
  sql += `-- Additional images: \n`;
  additionalImages.forEach((img, idx) => sql += `--   ${idx + 1}. ${img}\n`);
  
  // If you have a separate images column for galleries, you could update it like this:
  // sql += `UPDATE services SET image_url = '${primaryImage}', gallery_images = '${JSON.stringify(allImages)}' WHERE id = '${serviceId}';`;
  
  // For now, just update the main image_url with the primary image
  sql += `UPDATE services SET image_url = '${primaryImage}' WHERE id = '${serviceId}';\n\n`;
  
  return sql;
}

/**
 * Generates sample SQL updates with placeholders for multiple images
 */
function generateMultipleImageSqlUpdates(services: Service[]): void {
  console.log('\n--- MULTIPLE IMAGE SQL UPDATES TEMPLATE ---\n');
  console.log('-- This template shows how to update services with multiple images');
  console.log('-- Find 3 images for each service using the search links below');
  console.log('-- Then replace the placeholder URLs with actual image URLs\n');
  
  services.forEach((service, index) => {
    console.log(`-- ${index + 1}. ${service.name} (${service.service_type}) - ${service.location}`);
    console.log(`-- Search: ${generateGoogleSearchUrl(service.name, service.service_type)}`);
    console.log(generateUpdateStatementWithMultipleImages(
      service.id,
      'https://example.com/path-to-primary-image.jpg',  // Replace with actual primary image
      [  // Replace these with actual additional images
        'https://example.com/path-to-secondary-image.jpg',
        'https://example.com/path-to-third-image.jpg'
      ],
      service.name
    ));
  });
  
  console.log('\n-- INSTRUCTIONS:');
  console.log('-- 1. Visit each search link to find appropriate images for the service');
  console.log('-- 2. Replace the placeholder URLs with actual image URLs you find');
  console.log('-- 3. Execute the SQL statements in your database management tool');
  console.log('-- 4. For multiple images per service, you may need to extend your DB schema');
  console.log('--    Consider adding a gallery_images JSONB column to store multiple images');
}

async function main() {
  try {
    const services = await fetchServicesNeedingPhotos();
    
    if (services.length === 0) {
      console.log('No services need new photos.');
      return;
    }
    
    generateMultipleImageSqlUpdates(services);
    
    console.log(`\nGenerated templates for ${services.length} services.`);
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
if (import.meta.url) {
  if (process.argv[1] === __filename) {
    main();
  }
}

export { fetchServicesNeedingPhotos };
export type { Service };