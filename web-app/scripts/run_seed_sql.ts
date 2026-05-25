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

// Order of tables to process (FK-safe order)
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

function normalizeValue(value: string): any {
  value = value.trim();
  if (value === 'NULL' || value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Handle ::jsonb cast
  let isJsonb = false;
  if (value.endsWith('::jsonb')) {
    value = value.substring(0, value.length - 7).trim();
    isJsonb = true;
  }
  
  // Handle single-quoted strings
  if (value.startsWith("'") && value.endsWith("'")) {
    const strVal = value.substring(1, value.length - 1).replace(/''/g, "'");
    if (isJsonb) {
      try {
        return JSON.parse(strVal);
      } catch (e) {
        console.warn('⚠️ Failed to parse JSON string:', strVal.substring(0, 100));
        return strVal;
      }
    }
    return strVal;
  }
  
  // Numbers
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }
  
  return value;
}

function parseRows(valuesSection: string): string[] {
  const rows: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;
  let escapeNext = false;
  
  for (let i = 0; i < valuesSection.length; i++) {
    const char = valuesSection[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      current += char;
      escapeNext = true;
      continue;
    }
    
    if (char === "'") {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    
    if (!inQuotes) {
      if (char === '(') {
        depth++;
        if (depth === 1) {
          current = '';
          continue;
        }
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          rows.push(current);
          current = '';
          continue;
        }
      }
    }
    
    if (depth > 0) {
      current += char;
    }
  }
  
  return rows;
}

function parseRowValues(rowStr: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let escapeNext = false;
  
  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      current += char;
      escapeNext = true;
      continue;
    }
    
    if (char === "'") {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    
    if (!inQuotes && char === ',') {
      values.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  values.push(current.trim());
  return values;
}

async function main() {
  const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error(`❌ seed.sql not found at ${seedPath}`);
    process.exit(1);
  }

  console.log(`📖 Reading seed SQL file from ${seedPath}...`);
  const sql = fs.readFileSync(seedPath, 'utf8');

  // 1. Clear tables in reverse order to respect foreign key constraints
  console.log('\n--- 🗑️ STEP 1: Clearing remote database tables in reverse order ---');
  const reversedTables = [...TABLES].reverse();
  for (const table of reversedTables) {
    try {
      const { data, error: fetchError } = await supabase.from(table).select('*').limit(1);
      if (fetchError) {
        if (fetchError.message.includes('does not exist')) {
          console.log(`⚠️ Table ${table} does not exist in the schema. Skipping.`);
        } else {
          console.error(`❌ Error reading table schema for ${table}:`, fetchError.message);
        }
        continue;
      }

      if (data && data.length > 0) {
        const firstCol = Object.keys(data[0])[0];
        const val = data[0][firstCol];
        let filterVal: any = '___impossible_value_to_not_delete___';
        if (typeof val === 'number') {
          filterVal = -999999;
        } else if (typeof val === 'string') {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
          if (isUuid) {
            filterVal = '00000000-0000-0000-0000-000000000000';
          }
        }

        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq(firstCol, filterVal);

        if (deleteError) {
          console.error(`❌ Error clearing table ${table}:`, deleteError.message);
        } else {
          console.log(`🗑️ Cleared table: ${table}`);
        }
      } else {
        console.log(`🗑️ Table ${table} is already empty.`);
      }
    } catch (e: any) {
      console.error(`❌ Unexpected error clearing ${table}:`, e.message || e);
    }
  }

  // 2. Parse and execute INSERT statements
  console.log('\n--- 📥 STEP 2: Seeding tables with data ---');
  const parts = sql.split('INSERT INTO public.');

  // Store parsed inserts by table name to execute in the FK-safe TABLES order
  const insertsByTable: { [key: string]: { columns: string[], records: any[] }[] } = {};

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    const firstParenClose = part.indexOf(')');
    if (firstParenClose === -1) continue;

    const tableNameAndCols = part.substring(0, firstParenClose + 1).trim();
    const tableNameMatch = tableNameAndCols.match(/^(\w+)\s*\((.+)\)$/s);
    if (!tableNameMatch) continue;

    const tableName = tableNameMatch[1];
    const columns = tableNameMatch[2].split(',').map(c => c.trim().replace(/["']/g, ''));

    const valuesIndex = part.indexOf('VALUES');
    if (valuesIndex === -1) continue;

    const rest = part.substring(valuesIndex + 6).trim();
    
    let inQuotes = false;
    let escapeNext = false;
    let depth = 0;
    let endIdx = -1;

    for (let cIdx = 0; cIdx < rest.length; cIdx++) {
      const char = rest[cIdx];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === "'") {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
        } else if (char === ';' && depth === 0) {
          endIdx = cIdx;
          break;
        }
      }
    }

    const valuesSection = endIdx === -1 ? rest : rest.substring(0, endIdx).trim();
    const rawRows = parseRows(valuesSection);
    const records: any[] = [];

    for (const rawRow of rawRows) {
      const rawValues = parseRowValues(rawRow);
      if (columns.length === rawValues.length) {
        const record: any = {};
        columns.forEach((col, idx) => {
          record[col] = normalizeValue(rawValues[idx]);
        });
        records.push(record);
      } else {
        console.warn(`⚠️ Warning: Column/value length mismatch in table ${tableName}. Expected ${columns.length}, got ${rawValues.length}`);
      }
    }

    if (records.length > 0) {
      if (!insertsByTable[tableName]) {
        insertsByTable[tableName] = [];
      }
      insertsByTable[tableName].push({ columns, records });
    }
  }

  // Now execute the inserts in standard FK-safe TABLES order
  for (const table of TABLES) {
    const tableInserts = insertsByTable[table];
    if (!tableInserts || tableInserts.length === 0) {
      console.log(`📥 No seed data found for table: ${table}`);
      continue;
    }

    let totalInserted = 0;
    console.log(`📥 Seeding table ${table}...`);

    for (const insertGroup of tableInserts) {
      const records = insertGroup.records;
      const chunkSize = 200; // Small batch size for reliability

      for (let offset = 0; offset < records.length; offset += chunkSize) {
        const chunk = records.slice(offset, offset + chunkSize);
        
        // Remove generated columns that PostgreSQL should calculate dynamically
        const sanitizedChunk = chunk.map(row => {
          const cleanRow = { ...row };
          delete cleanRow.total_price;
          delete cleanRow.amount;
          delete cleanRow.total_spend;

          // Sanitize jsonb columns specifically for service_pricing
          if (table === 'service_pricing') {
            const jsonbCols = ['occupancy_pricing', 'net_occupancy_pricing'];
            jsonbCols.forEach(col => {
              if (cleanRow[col] !== undefined && cleanRow[col] !== null) {
                let val = cleanRow[col];
                if (typeof val === 'string') {
                  try { val = JSON.parse(val); } catch(e){}
                }
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                  cleanRow[col] = val;
                } else {
                  cleanRow[col] = null;
                }
              } else {
                cleanRow[col] = null;
              }
            });
          }
          return cleanRow;
        });

        const { error } = await supabase.from(table).insert(sanitizedChunk);

        if (error) {
          console.error(`  ❌ Error inserting into ${table} (offset ${offset}):`, error.message);
        } else {
          totalInserted += chunk.length;
        }
      }
    }

    console.log(`  ✅ Successfully seeded ${totalInserted} rows into ${table}.`);
  }

  console.log('\n🎉 Database Seeding Complete!');
}

main().catch(console.error);
