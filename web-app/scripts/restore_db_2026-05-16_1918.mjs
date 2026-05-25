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
    'service_pricing'
];

async function clearTable(table) {
    const keys = [
        { name: 'id', value: '00000000-0000-0000-0000-000000000000' },
        { name: 'key', value: '___non_existent___' },
        { name: 'name', value: '___non_existent___' }
    ];
    for (const key of keys) {
        const { error } = await supabase.from(table).delete().neq(key.name, key.value);
        if (!error) return true;
        if (error.message.includes('column') && error.message.includes('does not exist')) continue;
    }
    return false;
}

async function restore() {
    const timestamp = '2026-05-16_1918';
    const backupDir = path.join('supabase', 'backups', `data_${timestamp}`);
    
    console.log(`🚀 Starting Database Restoration from ${backupDir}...`);

    // Reverse order for clearing to satisfy FK constraints
    const reverseTables = [...tables].reverse();
    for (const table of reverseTables) {
        console.log(`🗑️ Clearing table: ${table}...`);
        await clearTable(table);
    }

    for (const table of tables) {
        console.log(`📥 Restoring table: ${table}...`);
        const filePath = path.join(backupDir, `${table}.json`);
        
        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️ No backup file found for ${table}`);
            continue;
        }

        let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!data || data.length === 0) {
            console.log(`   ⚠️ No data found in backup for ${table}`);
            continue;
        }

        // Filter out generated columns if they exist in JSON
        data = data.map(row => {
            delete row.total_price;
            delete row.amount;
            delete row.total_spend;
            return row;
        });

        // Sort navigations to avoid FK issues with parent_id
        if (table === 'navigations') {
            data.sort((a, b) => {
                if (!a.parent_id && b.parent_id) return -1;
                if (a.parent_id && !b.parent_id) return 1;
                return 0;
            });
        }

        console.log(`   Found ${data.length} records. Inserting...`);
        
        // Small chunks for reliability
        const chunkSize = 20;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const { error } = await supabase.from(table).insert(chunk);
            if (error) {
                console.error(`      ❌ Error inserting into ${table}:`, error.message);
            }
        }
    }

    console.log('✅ Database Restoration Complete!');
}

restore().catch(console.error);
