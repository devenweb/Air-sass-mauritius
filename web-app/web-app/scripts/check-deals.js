require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeals() {
    const { data, count, error } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('is_seasonal_deal', true);
    
    if (error) {
        console.error('Error fetching deals:', error);
        return;
    }
    
    console.log(`Total seasonal deals: ${count}`);
}

checkDeals();
