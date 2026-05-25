import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { fileURLToPath } from 'url';

// For ESM, check if the script is run directly using import.meta
if (import.meta.url.startsWith('file:')) {
  const currentFilePath = fileURLToPath(import.meta.url);
  // const currentDir = dirname(currentFilePath); // Unused
  
  // Ensure we're running the script directly
  const isMain = currentFilePath === fileURLToPath(new URL('.', import.meta.url));
  if (isMain) {
    main();
  }
}

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
 * Prints a formatted list of services with their current image and a Google search link
 */
function printFormattedServices(services: Service[]): void {
  console.log('\n--- SERVICES LIST ---\n');
  
  services.forEach((service, index) => {
    console.log(`${index + 1}. ${service.name}`);
    console.log(`   Type: ${service.service_type}`);
    console.log(`   Location: ${service.location}`);
    console.log(`   Current Image: ${service.image_url || 'None'}`);
    console.log(`   Rating: ${service.rating}`);
    console.log(`   Search Photos: ${generateGoogleSearchUrl(service.name, service.service_type)}`);
    console.log('');
  });
}

async function main() {
  try {
    const services = await fetchAllServices();
    
    if (services.length === 0) {
      console.log('No services to process.');
      return;
    }
    
    printFormattedServices(services);
    
    console.log(`Processed ${services.length} services.`);
  } catch (error) {
    console.error('Script failed:', error);
  }
}

// Run the script
// ESM equivalent of `require.main === module` handled above

export { fetchAllServices };
export type { Service };