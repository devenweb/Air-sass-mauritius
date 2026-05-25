const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Users/deven/Desktop/web-app/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSettings() {
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'general_config')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('General Config:', JSON.stringify(data.value, null, 2));
}

checkSettings();
