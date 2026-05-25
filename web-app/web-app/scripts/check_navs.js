const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/deven/Desktop/web-app/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkNavs() {
    const { data, error } = await supabase
        .from('navigations')
        .select('*')
        .order('display_order', { ascending: true });
        
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Navigations:', JSON.stringify(data.map(d => ({label: d.label, link: d.link})), null, 2));
    }
}

checkNavs();
