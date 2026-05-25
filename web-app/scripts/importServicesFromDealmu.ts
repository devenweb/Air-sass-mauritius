import { createClient } from '@supabase/supabase-js';
import { initBrowser, createPage, extractStructuredData, parsePrice, normalizeRegion, sleep } from './scraperUtils';
import { v4 as uuidv4 } from 'uuid';

// Define types for our data
interface ServiceData {
  id: string;
  name: string;
  location: string;
  image_url: string;
  service_type: string;
  rating?: number;
  description?: string;
  duration_days?: number;
  duration_hours?: number;
  amenities?: string[];
  region?: string;
  gallery_images?: string[];
  meta_title?: string;
  meta_description?: string;
  seo_keywords?: string;
  special_features?: any;
  seasonality?: string;
  highlights?: any;
  included?: any;
  not_included?: any;
  cancellation_policy?: string;
  terms_and_conditions?: string;
  thumbnail_url?: string;
  banner_url?: string;
  featured?: boolean;
  priority?: number;
  secondary_image_url?: string;
  child_price?: number;
  meal_plans?: any[];
  stock?: number;
  status?: string;
  cta_text?: string;
  cta_link?: string;
  short_description?: string;
  max_group_size?: number;
  max_adults?: number;
  max_children?: number;
  child_age_limit?: number;
  room_types?: any[];
  itinerary?: any[];
}

// Function to scrape services from deal.mu
async function scrapeDealMuServices(): Promise<ServiceData[]> {
  console.log('Starting to scrape services from deal.mu...');
  
  const browser = await initBrowser();
  const page = await createPage(browser);
  
  try {
    // Navigate to deal.mu or relevant section
    await page.goto('https://www.deal.mu', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Extract services data using structured extraction
    const services = await extractStructuredData(page, '.deal-item, .service-card, .product-card', {
      name: (el) => el.querySelector('.title, .name, h3, h4')?.textContent?.trim() || 
               el.querySelector('a')?.textContent?.trim() || 'Unknown Service',
      priceText: (el) => el.querySelector('.price')?.textContent?.trim() || '',
      location: (el) => el.querySelector('.location')?.textContent?.trim() || '',
      imageUrl: (el) => el.querySelector('img')?.getAttribute('src') || '',
      rating: (el) => {
        const ratingEl = el.querySelector('.rating, .stars');
        if (ratingEl) {
          const ratingMatch = ratingEl.textContent?.match(/\d+(\.\d+)?/);
          return ratingMatch ? parseFloat(ratingMatch[0]) : 0;
        }
        return 0;
      }
    });
    
    console.log(`Scraped ${services.length} potential services from deal.mu`);
    
    // Process the scraped data
    const processedServices: ServiceData[] = services
      .filter(service => service.name && service.name !== 'Unknown Service') // Filter out invalid entries
      .map(service => {
        const tempPrice = parsePrice(service.priceText);
        const region = normalizeRegion(service.location);
        
        // Determine service type based on location or other criteria
        let serviceType = 'activity';
        if (service.name.toLowerCase().includes('hotel') || 
            service.name.toLowerCase().includes('resort') || 
            service.name.toLowerCase().includes('villa')) {
          serviceType = 'hotel';
        } else if (service.name.toLowerCase().includes('flight')) {
          serviceType = 'flight';
        } else if (service.name.toLowerCase().includes('spa')) {
          serviceType = 'spa';
        } else if (service.name.toLowerCase().includes('tour') || service.name.toLowerCase().includes('excursion')) {
          serviceType = 'tour';
        } else if (service.name.toLowerCase().includes('transfer') || service.name.toLowerCase().includes('car')) {
          serviceType = 'transfer';
        }
        
        return {
          id: uuidv4(),
          name: service.name,
          location: service.location,
          image_url: service.imageUrl,
          service_type: serviceType,
          rating: service.rating || undefined,
          description: '',
          region,
          featured: false,
          priority: 0,
          status: 'In Stock',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          meta_title: service.name,
          meta_description: `Find great deals on ${service.name} at deal.mu. Compare prices and book online.`,
          seo_keywords: `${service.name}, Mauritius, deal, discount, ${serviceType}`,
          highlights: {
            value: 'Great deal',
            availability: 'Limited time offer',
          },
          terms_and_conditions: 'Standard terms and conditions apply. Subject to availability.',
        };
      });
    
    console.log(`Processed ${processedServices.length} valid services from deal.mu`);
    
    await browser.close();
    return processedServices;
  } catch (error) {
    console.error('Error scraping deal.mu:', error);
    await browser.close();
    return [];
  }
}

// Function to insert services into our database
async function insertServicesIntoDB(services: ServiceData[]) {
  console.log(`Preparing to insert ${services.length} services into database...`);
  
  // Initialize Supabase client using environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Process services in batches to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < services.length; i += batchSize) {
    const batch = services.slice(i, i + batchSize);
    
    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(services.length / batchSize)}`);
    
    const { error } = await supabase
      .from('services')
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
    } else {
      console.log(`Successfully inserted batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    // Add delay between batches to prevent overwhelming the database
    await sleep(1000);
  }
}

// Main function to run the import process
export async function importServicesFromDealmu() {
  try {
    console.log('Starting import process from deal.mu...');
    
    // Step 1: Scrape services from deal.mu
    const services = await scrapeDealMuServices();
    
    if (services.length === 0) {
      console.log('No services found to import');
      return;
    }
    
    // Step 2: Insert services into our database
    await insertServicesIntoDB(services);
    
    console.log(`Successfully imported ${services.length} services from deal.mu`);
  } catch (error) {
    console.error('Error during import process:', error);
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importServicesFromDealmu()
    .then(() => {
      console.log('Import completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}