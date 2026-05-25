
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectValues() {
  const { data, error } = await supabase.from('services').select('service_type, status').limit(5);
  if (error) {
    console.error('Error fetching services:', error);
  } else {
    console.log('Sample Data from Services:', JSON.stringify(data, null, 2));
  }
  process.exit(0);
}

inspectValues();
