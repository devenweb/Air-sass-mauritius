const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Role Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const backupDir = path.join(__dirname, '../supabase/backups', timestamp);
  const dataDir = path.join(backupDir, 'data');
  const schemaDir = path.join(backupDir, 'schema');

  // Create directories
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(schemaDir, { recursive: true });

  console.log(`Starting backup to ${backupDir}...`);

  // List of tables to backup (or we could try to fetch them dynamically)
  const tables = [
    'services',
    'categories',
    'site_settings',
    'navigations',
    'room_types',
    'service_pricing',
    'bookings',
    'reviews',
    'customers',
    'faqs',
    'hero_slides',
    'cms_pages',
    'content_blocks',
    'staff'
  ];

  for (const table of tables) {
    console.log(`Backing up table: ${table}...`);
    
    // 1. Backup Data
    const { data, error } = await supabase
      .from(table)
      .select('*');

    if (error) {
      console.error(`Error fetching data for ${table}:`, error.message);
    } else {
      fs.writeFileSync(
        path.join(dataDir, `${table}.json`),
        JSON.stringify(data, null, 2)
      );
      console.log(`Data for ${table} saved.`);
    }

    // 2. Backup Schema (Basic column info)
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: table });

    // Note: get_table_columns might not exist, let's try a direct query if possible
    // Since we are using the service role key, we might have access to some internal tables
    // but usually RPC is safer if defined. If not, we'll just skip or use a fallback.
    
    if (colError) {
      // Fallback: try to get column names from the first data row
      if (data && data.length > 0) {
        const schemaInfo = {
          table,
          columns: Object.keys(data[0])
        };
        fs.writeFileSync(
          path.join(schemaDir, `${table}.json`),
          JSON.stringify(schemaInfo, null, 2)
        );
      }
    } else {
      fs.writeFileSync(
        path.join(schemaDir, `${table}.json`),
        JSON.stringify(columns, null, 2)
      );
    }
  }

  console.log('Backup completed successfully!');
}

backup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
