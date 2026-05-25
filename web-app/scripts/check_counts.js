const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/deven/Desktop/web-app/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTables() {
    const tables = ['site_settings', 'navigations', 'categories', 'services', 'orders'];
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.log(`${table}: Error ${error.message}`);
        } else {
            console.log(`${table}: ${count} rows`);
        }
    }
}

checkTables();
