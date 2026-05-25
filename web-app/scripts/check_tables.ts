import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TABLES = [
  'site_settings',
  'categories',
  'admins',
  'email_templates',
  'customers',
  'services',
  'service_categories',
  'room_types',
  'hero_slides',
  'faqs',
  'content_blocks',
  'inquiries',
  'subscribers',
  'popup_ads',
  'navigations',
  'partners',
  'bookings',
  'booking_items',
  'service_pricing'
];

async function check() {
  console.log('📊 Table Row Counts on Remote Supabase:');
  for (const table of TABLES) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} rows`);
      }
    } catch (e: any) {
      console.error(`❌ ${table}: ${e.message}`);
    }
  }
}

check();
