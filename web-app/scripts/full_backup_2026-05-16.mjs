import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
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
    'service_pricing',
    'amenities',
    'amenity_icons'
];

async function backup() {
    const timestamp = '2026-05-16_1918';
    const backupDir = path.join('supabase', 'backups', `data_${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`🚀 Starting Full Database Backup to ${backupDir}...`);

    for (const table of tables) {
        console.log(`📤 Exporting table: ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        
        if (error) {
            console.error(`   ❌ Error fetching ${table}:`, error.message);
            continue;
        }

        const filePath = path.join(backupDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`   ✅ Saved ${data.length} records to ${table}.json`);
    }

    console.log('✅ Full Database Backup Complete!');
}

backup().catch(console.error);
