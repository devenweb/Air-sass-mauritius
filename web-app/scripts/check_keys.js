const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Manual path resolution
const env = dotenv.config({ path: 'c:/Users/deven/Desktop/web-app/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllSettings() {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Site Settings Keys:', data.map(d => d.key));
}

checkAllSettings();
