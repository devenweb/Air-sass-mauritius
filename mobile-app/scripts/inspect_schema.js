
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  const { data, error } = await supabase.from('services').select('*').limit(1);
  if (error) {
    console.error('Error fetching services:', error);
  } else if (data && data.length > 0) {
    console.log('FULL COLUMNS IN SERVICES:', JSON.stringify(Object.keys(data[0]), null, 2));
  } else {
    console.log('No data found in services table.');
  }

  const { data: catData, error: catError } = await supabase.from('categories').select('*').limit(1);
  if (catError) {
    console.error('Error fetching categories:', catError);
  } else if (catData && catData.length > 0) {
    console.log('FULL COLUMNS IN CATEGORIES:', JSON.stringify(Object.keys(catData[0]), null, 2));
  }

  process.exit(0);
}

inspectSchema();
