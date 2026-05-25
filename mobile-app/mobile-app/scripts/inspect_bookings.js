
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBookings() {
  console.log('Inspecting bookings table...');
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching bookings:', error);
  } else {
    console.log('Columns in bookings table:', data.length > 0 ? Object.keys(data[0]) : 'No data, checking rpc...');
    
    // If no data, try to get columns from information_schema via rpc if available, 
    // but usually just doing a select * on an empty table works if RLS allows.
    // Let's try to insert a dummy one or use a safer way.
  }
}

inspectBookings();
