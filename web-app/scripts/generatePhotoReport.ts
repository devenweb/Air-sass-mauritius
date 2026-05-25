import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

async function fetchAllServices() {
  try {
    console.log('Fetching all services from database...');
    
    const { data, error } = await supabase
      .from('services')
      .select('id, name, service_type, location, image_url, rating')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching services: ${error.message}`);
    }

    if (!data) {
      console.log('No services found in the database.');
      return [];
    }

    console.log(`Found ${data.length} services in the database.`);
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
 * Determines if a service needs a new photo based on the current image URL
 */
function needsNewPhoto(imageUrl: string | null): boolean {
  // These are placeholder images that should be replaced
  const placeholderImages = [
    '/hero-hotel.png',
    '/hero-adventure.png',
    '/placeholders/',
    '/assets/hero/',
    '/placeholders/activity_main.png',
    '/placeholders/tour_main.png',
    '/placeholders/hotel_main.png',
    '/placeholders/cruise_main.png',
    '/placeholders/flight_main.png',
    '/placeholders/transfer_main.png'
  ];
  
  if (!imageUrl) return true;
  
  return placeholderImages.some(placeholder => 
    imageUrl.includes(placeholder)
  );
}

/**
 * Generates a detailed report of services with photo status
 */
function generatePhotoReport(services: Service[]): void {
  console.log('\n--- PHOTO STATUS REPORT ---\n');
  
  const needNewPhoto = services.filter(service => needsNewPhoto(service.image_url));
  const haveGoodPhoto = services.filter(service => !needsNewPhoto(service.image_url));
  
  console.log(`Total Services: ${services.length}`);
  console.log(`Services needing new photos: ${needNewPhoto.length}`);
  console.log(`Services with good photos: ${haveGoodPhoto.length}\n`);
  
  if (needNewPhoto.length > 0) {
    console.log('=== SERVICES NEEDING NEW PHOTOS ===\n');
    
    needNewPhoto.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} (${service.service_type})`);
      console.log(`   Location: ${service.location}`);
      console.log(`   Current Image: ${service.image_url || 'None'}`);
      console.log(`   Rating: ${service.rating}`);
      console.log(`   Search Photos: ${generateGoogleSearchUrl(service.name, service.service_type)}`);
      console.log('');
    });
  }
  
  if (haveGoodPhoto.length > 0) {
    console.log('=== SERVICES WITH GOOD PHOTOS ===\n');
    
    haveGoodPhoto.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} (${service.service_type})`);
      console.log(`   Location: ${service.location}`);
      console.log(`   Current Image: ${service.image_url}`);
      console.log(`   Rating: ${service.rating}`);
      console.log('');
    });
  }
  
  console.log(`\nSUMMARY:`);
  console.log(`- ${needNewPhoto.length} services need new photos`);
  console.log(`- ${haveGoodPhoto.length} services already have good photos`);
  console.log(`- Total: ${services.length} services`);
}

/**
 * Generates a CSV-like output for easy import to spreadsheet
 */
function generateCSVOutput(services: Service[]): void {
  console.log('\n--- CSV OUTPUT (copy and paste to spreadsheet) ---\n');
  
  console.log('Name,Type,Location,Current Image,Rating,Needs New Photo,Search URL');
  
  services.forEach(service => {
    const needsNew = needsNewPhoto(service.image_url) ? 'YES' : 'NO';
    const searchUrl = generateGoogleSearchUrl(service.name, service.service_type);
    
    // Properly escape quotes and commas in fields
    const name = `"${service.name.replace(/"/g, '""')}"`;
    const location = `"${service.location.replace(/"/g, '""')}"`;
    
    console.log([
      name,
      service.service_type,
      location,
      `"${service.image_url || 'None'}"`,
      service.rating,
      needsNew,
      searchUrl
    ].join(','));
  });
}

async function main() {
  try {
    const services = await fetchAllServices();
    
    if (services.length === 0) {
      console.log('No services to process.');
      return;
    }
    
    generatePhotoReport(services);
    generateCSVOutput(services);
    
    console.log(`\nProcessed ${services.length} services.`);
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
if (import.meta.url.endsWith(process.argv[1])) {
  main();
}

export { fetchAllServices, needsNewPhoto, generateGoogleSearchUrl };
export type { Service };