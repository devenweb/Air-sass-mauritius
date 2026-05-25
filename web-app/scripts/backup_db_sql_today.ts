import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase URL or Service Role Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TABLES = [
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
  'amenity_icons',
  'hotel_rooms',
  'popular_destinations',
  'editorial_posts',
  'staff',
  'reviews'
];

async function fetchAllRows(tableName: string): Promise<any[]> {
  let allData: any[] = [];
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  // Check if table exists and get columns by fetching 1 row
  const { data: firstRow, error: firstError } = await supabase.from(tableName).select('*').limit(1);
  if (firstError) {
    throw firstError;
  }
  
  if (!firstRow || firstRow.length === 0) {
    const { count, error: countError } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    if (countError) throw countError;
    if (count === 0) return [];
  }

  const sample = firstRow && firstRow[0] ? firstRow[0] : null;
  const columns = sample ? Object.keys(sample) : [];
  let sortColumn = 'id';
  if (!columns.includes('id')) {
    if (columns.includes('key')) {
      sortColumn = 'key';
    } else if (columns.includes('created_at')) {
      sortColumn = 'created_at';
    } else if (columns.length > 0) {
      sortColumn = columns[0];
    } else {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      return data || [];
    }
  }

  while (hasMore) {
    const to = from + limit - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, to)
      .order(sortColumn, { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData.push(...data);
      if (data.length < limit) {
        hasMore = false;
      } else {
        from += limit;
      }
    }
  }
  return allData;
}

async function generateBackup() {
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupDir = path.join(process.cwd(), 'supabase', 'backups', `sql_${dateStr}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`🚀 Generating SQL database backup to ${backupDir}...`);
  
  let sql = `-- ==========================================\n`;
  sql += `-- ROYAL TRAVEL AGENCY DATABASE SQL BACKUP\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- ==========================================\n\n`;
  sql += `SET session_replication_role = 'replica';\n\n`;

  for (const table of TABLES) {
    console.log(`📦 Fetching data for table: ${table}...`);
    try {
      const data = await fetchAllRows(table);

      if (data.length === 0) {
        console.log(`⚠️ Table ${table} is empty. Skipping.`);
        continue;
      }

      console.log(`   ✅ Fetched ${data.length} rows.`);

      sql += `-- Data for ${table} (${data.length} rows)\n`;
      sql += `TRUNCATE TABLE public.${table} CASCADE;\n\n`;
      
      const columns = Object.keys(data[0]);
      
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        sql += `INSERT INTO public.${table} (${columns.join(', ')})\nVALUES\n`;

        const values = batch.map((row: any) => {
          const rowValues = columns.map((colName) => {
            const val = row[colName];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') {
              return `'${val.replace(/'/g, "''")}'`;
            }
            if (typeof val === 'object') {
              return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            }
            if (typeof val === 'boolean') {
              return val ? 'true' : 'false';
            }
            return val;
          });
          return `(${rowValues.join(', ')})`;
        });

        sql += values.join(',\n') + ';\n\n';
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('does not exist') || err.message.includes('not found'))) {
        console.log(`⚠️ Table ${table} does not exist in schema. Skipping.`);
      } else {
        console.error(`❌ Unexpected error on table ${table}:`, err.message || err);
      }
    }
  }

  sql += `SET session_replication_role = 'origin';\n`;

  const outputSqlPath = path.join(process.cwd(), 'supabase', 'seed.sql');
  fs.writeFileSync(outputSqlPath, sql);
  console.log(`\n✅ SQL Data backup written to ${outputSqlPath}`);

  // Copy infrastructure files if they exist in supabase folder
  const sourceDir = path.join(process.cwd(), 'supabase');
  const filesToCopy = ['infrastructure.sql', 'policies.sql', 'structure.sql'];
  
  for (const filename of filesToCopy) {
    const srcPath = path.join(sourceDir, filename);
    const destPath = path.join(backupDir, filename);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`   Copied ${filename} to backup folder.`);
    }
  }
  
  console.log('\n🎉 Backup Completed Successfully!');
}

generateBackup().catch(console.error);
