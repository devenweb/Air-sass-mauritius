import { createClient } from '@supabase/supabase-js';
import { initBrowser, createPage, extractStructuredData, parsePrice, normalizeRegion, sleep } from './scraperUtils';
import { v4 as uuidv4 } from 'uuid';

// Define types for hotel data
interface HotelData {
  id: string;
  name: string;
  location: string;
  image_url: string;
  service_type: 'hotel' | 'resort' | 'villa' | 'apartment';
  rating?: number;
  description?: string;
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
  created_at?: string;
  updated_at?: string;
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
  check_in_time?: string;
  check_out_time?: string;
  property_type?: string;
  star_rating?: number;
  policies?: any;
}

// Function to scrape hotels specifically from deal.mu
async function scrapeDealMuHotels(): Promise<HotelData[]> {
  console.log('Starting to scrape hotels from deal.mu...');
  
  const browser = await initBrowser();
  const page = await createPage(browser);
  
  try {
    // Navigate to deal.mu's main page (deal.mu doesn't have a specific hotels subpage)
    await page.goto('https://www.deal.mu', { waitUntil: 'networkidle2' });
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Extract hotel data using structured extraction from main page
    const hotels = await extractStructuredData(page, '.deal-item, .service-card, .product-card', {
      name: (el) => el.querySelector('.hotel-name, .property-title, h3, h4')?.textContent?.trim() || 
               el.querySelector('a')?.textContent?.trim() || 'Unknown Hotel',
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
      },
      amenities: (el) => {
        const amenitiesEl = el.querySelector('.amenities, .features');
        if (amenitiesEl) {
          return Array.from(amenitiesEl.querySelectorAll('li, div, span')).map(a => a.textContent?.trim()).join('|');
        }
        return '';
      }
    });
    
    // Filter to only include hotels/villas/resorts
    const hotelItems = hotels.filter(item => {
      const lowerName = item.name.toLowerCase();
      return lowerName.includes('hotel') || 
             lowerName.includes('resort') || 
             lowerName.includes('villa') || 
             lowerName.includes('apartment') || 
             lowerName.includes('suite') ||
             lowerName.includes('lodge');
    });
    
    console.log(`Scraped ${hotelItems.length} potential hotels from deal.mu`);
    
    // Process the scraped data
    const processedHotels: HotelData[] = hotelItems
      .filter(hotel => hotel.name && hotel.name !== 'Unknown Hotel') // Filter out invalid entries
      .map(hotel => {
        const tempPrice = parsePrice(hotel.priceText);
        const region = normalizeRegion(hotel.location);
        const amenities = hotel.amenities ? hotel.amenities.split('|').filter(a => a.trim() !== '') : [];
        
        // Determine property type based on name
        let propertyType: 'hotel' | 'resort' | 'villa' | 'apartment' = 'hotel';
        if (hotel.name.toLowerCase().includes('resort')) propertyType = 'resort';
        if (hotel.name.toLowerCase().includes('villa')) propertyType = 'villa';
        if (hotel.name.toLowerCase().includes('apartment') || hotel.name.toLowerCase().includes('suite')) propertyType = 'apartment';
        
        return {
          id: uuidv4(),
          name: hotel.name,
          location: hotel.location,
          image_url: hotel.imageUrl,
          service_type: propertyType,
          rating: hotel.rating || undefined,
          description: `Stay at ${hotel.name} in ${hotel.location}. Enjoy amenities like ${amenities.slice(0, 3).join(', ')}.`,
          amenities,
          region,
          featured: false,
          priority: 0,
          status: 'In Stock',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          meta_title: `${hotel.name} - Book Your Stay in ${hotel.location} | Great Deals`,
          meta_description: `Book your stay at ${hotel.name} in ${hotel.location}. Compare prices and find the best deals on rooms, suites, and packages.`,
          seo_keywords: `${hotel.name}, ${hotel.location}, Mauritius accommodation, hotel deal, resort, booking`,
          highlights: {
            propertyType,
            amenities: amenities,
            value: 'Great value for money',
            location: `Located in ${region}, Mauritius`
          },
          terms_and_conditions: 'Standard hotel booking terms and conditions apply. Cancellation policies vary by room type.',
          check_in_time: '14:00',
          check_out_time: '11:00',
          star_rating: hotel.rating ? Math.round(hotel.rating) : undefined,
          short_description: `Luxury ${propertyType} in ${region} at competitive prices`,
          max_adults: 4,
          max_children: 3,
          child_age_limit: 12,
        };
      });
    
    console.log(`Processed ${processedHotels.length} valid hotels from deal.mu`);
    
    await browser.close();
    return processedHotels;
  } catch (error) {
    console.error('Error scraping hotels from deal.mu:', error);
    await browser.close();
    return [];
  }
}

// Function to insert hotels into our database
async function insertHotelsIntoDB(hotels: HotelData[]) {
  console.log(`Preparing to insert ${hotels.length} hotels into database...`);
  
  // Initialize Supabase client using environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Process hotels in batches to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < hotels.length; i += batchSize) {
    const batch = hotels.slice(i, i + batchSize);
    
    console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(hotels.length / batchSize)}`);
    
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

// Main function to run the hotel import process
export async function importHotelsFromDealmu() {
  try {
    console.log('Starting hotel import process from deal.mu...');
    
    // Step 1: Scrape hotels from deal.mu
    const hotels = await scrapeDealMuHotels();
    
    if (hotels.length === 0) {
      console.log('No hotels found to import');
      return;
    }
    
    // Step 2: Insert hotels into our database
    await insertHotelsIntoDB(hotels);
    
    console.log(`Successfully imported ${hotels.length} hotels from deal.mu`);
  } catch (error) {
    console.error('Error during hotel import process:', error);
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importHotelsFromDealmu()
    .then(() => {
      console.log('Hotel import completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Hotel import failed:', error);
      process.exit(1);
    });
}