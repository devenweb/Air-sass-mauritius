
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCategories() {
  const { data, error } = await supabase.from('categories').select('name, slug');
  if (error) {
    console.error('Error fetching categories:', error);
  } else {
    console.log('Category Slugs:', JSON.stringify(data, null, 2));
  }
  process.exit(0);
}

inspectCategories();
