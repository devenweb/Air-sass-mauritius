import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TABLES = [
  'admins',
  'categories',
  'services',
  'room_types',
  'hotel_rooms',
  'site_settings',
  'hero_slides',
  'faqs',
  'navigations',
  'service_categories',
  'partners',
  'popular_destinations',
  'email_templates'
];

async function generateSeed() {
  console.log('🚀 Generating consolidated seed.sql from remote database...');
  let sql = `-- ==========================================\n`;
  sql += `-- SEED.SQL\n`;
  sql += `-- Consolidated Database Seed Data\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- ==========================================\n\n`;

  for (const table of TABLES) {
    console.log(`📦 Fetching data for ${table}...`);
    const { data, error } = await supabase.from(table).select('*');

    if (error) {
      console.error(`❌ Error fetching ${table}:`, error.message);
      continue;
    }

    if (!data || data.length === 0) {
      console.log(`⚠️ No data found for ${table}. Skipping.`);
      continue;
    }

    sql += `-- Data for ${table}\n`;
    sql += `INSERT INTO public.${table} (${Object.keys(data[0]).join(', ')})\nVALUES\n`;

    const values = data.map((row: any) => {
      const rowValues = Object.values(row).map((val: any) => {
        if (val === null) return 'NULL';
        if (typeof val === 'string') {
          return `'${val.replace(/'/g, "''")}'`;
        }
        if (typeof val === 'object') {
          return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
        }
        if (val instanceof Date) {
          return `'${val.toISOString()}'`;
        }
        return val;
      });
      return `(${rowValues.join(', ')})`;
    });

    sql += values.join(',\n') + '\n';
    sql += `ON CONFLICT (id) DO UPDATE SET\n`;
    sql += Object.keys(data[0])
      .filter(k => k !== 'id')
      .map(k => `  ${k} = EXCLUDED.${k}`)
      .join(',\n');
    sql += `;\n\n`;
  }

  const outputPath = path.join(process.cwd(), 'supabase', 'seed.sql');
  fs.writeFileSync(outputPath, sql);
  console.log(`✅ Seed file generated at ${outputPath}`);
}

generateSeed();
