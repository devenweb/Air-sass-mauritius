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

// Order of tables to fetch data for inserting
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
  'hotel_rooms',
  'popular_destinations',
  'editorial_posts',
  'reviews',
  'auth_audit_logs',
  'invoice_items',
  'invoices',
  'order_items',
  'orders',
  'product_categories',
  'products',
  'profiles'
];

async function main() {
  const adminSupabasePath = path.resolve('..', 'admin-app', 'supabase');
  const infrastructurePath = path.join(adminSupabasePath, 'infrastructure.sql');
  const processedInfrastructurePath = path.join(adminSupabasePath, 'backups', 'processed_backups', 'infrastructure.sql');
  const policiesPath = path.join(adminSupabasePath, 'backups', 'processed_backups', 'policies.sql');
  
  const outputPath = path.join(adminSupabasePath, 'tl_comprehensive_backup.sql');

  console.log(`Reading infrastructure schemas...`);
  if (!fs.existsSync(infrastructurePath)) {
    console.error(`❌ Infrastructure file not found at: ${infrastructurePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(processedInfrastructurePath)) {
    console.error(`❌ Processed infrastructure file not found at: ${processedInfrastructurePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(policiesPath)) {
    console.error(`❌ Policies file not found at: ${policiesPath}`);
    process.exit(1);
  }

  const infraContent = fs.readFileSync(infrastructurePath, 'utf8');
  const processedInfraContent = fs.readFileSync(processedInfrastructurePath, 'utf8');
  const policiesContent = fs.readFileSync(policiesPath, 'utf8');

  // Extract functions from infrastructure.sql
  // Look for lines containing functions
  const lines = infraContent.split('\n');
  let functionLines: string[] = [];
  let inFunction = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('CREATE OR REPLACE FUNCTION')) {
      inFunction = true;
    }
    if (inFunction) {
      functionLines.push(line);
      if (line.includes('$function$;') || line.includes('$$ LANGUAGE') || line.includes('$$ LANGUAGE plpgsql;')) {
        inFunction = false;
        functionLines.push('');
      }
    }
  }

  const customFunctionsSql = functionLines.join('\n');

  // Extract table definitions from processedInfrastructure.sql
  // Line 8 to line 467 are the table creation queries
  const processedInfraLines = processedInfraContent.split('\n');
  const tableDefinitions = processedInfraLines.slice(7, 467).join('\n');

  // Extract constraints from processedInfrastructure.sql
  // Line 468 to 601
  const constraintsDefinitions = processedInfraLines.slice(467, 601).join('\n');

  console.log('Generating full self-contained SQL script...');

  let sql = `-- ==========================================\n`;
  sql += `-- TRAVEL LOUNGE COMPREHENSIVE SYSTEM BACKUP\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- ==========================================\n\n`;

  sql += `SET session_replication_role = 'replica';\n\n`;

  // 1. DROP EXISTING CONSTRAINTS AND TABLES FIRST IF THEY EXIST
  sql += `-- 1. Drop existing triggers and rules\n`;
  sql += `DROP TRIGGER IF EXISTS update_services_updated_at ON public.services CASCADE;\n`;
  sql += `DROP TRIGGER IF EXISTS trg_service_pricing_updated_at ON public.service_pricing CASCADE;\n`;
  sql += `DROP TRIGGER IF EXISTS tr_sync_service_pricing_gross ON public.service_pricing CASCADE;\n`;
  sql += `DROP TRIGGER IF EXISTS tr_recalc_service_pricing_on_svc_fee_change ON public.services CASCADE;\n`;
  sql += `DROP TRIGGER IF EXISTS tr_recalc_service_pricing_on_room_fee_change ON public.room_types CASCADE;\n\n`;

  sql += `-- 2. Drop existing tables if they exist\n`;
  const dropTables = [...TABLES].reverse(); // Drop in reverse dependency order
  for (const table of dropTables) {
    sql += `DROP TABLE IF EXISTS public."${table}" CASCADE;\n`;
  }
  sql += `\n`;

  sql += `-- 3. Drop custom functions if they exist\n`;
  sql += `DROP FUNCTION IF EXISTS public.is_authorized_staff() CASCADE;\n`;
  sql += `DROP FUNCTION IF EXISTS public.is_elevated_admin() CASCADE;\n`;
  sql += `DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;\n`;
  sql += `DROP FUNCTION IF EXISTS public.fn_sync_service_pricing_gross() CASCADE;\n`;
  sql += `DROP FUNCTION IF EXISTS public.fn_recalc_service_pricing_on_fee_change() CASCADE;\n\n`;

  // 2. EXTENSIONS & CUSTOM FUNCTIONS
  sql += `-- 4. Enable Extensions\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";\n\n`;

  sql += `-- 5. Create Custom Functions\n`;
  sql += customFunctionsSql + `\n\n`;

  // 3. TABLE SCHEMA DEFINITIONS
  sql += `-- 6. Create Table Schemas\n`;
  sql += tableDefinitions + `\n\n`;

  // 4. INSERT DATA FOR EACH TABLE
  sql += `-- 7. Populate Data\n`;
  for (const table of TABLES) {
    console.log(`📦 Fetching data for table: ${table}...`);
    try {
      const { data, error } = await supabase.from(table).select('*');

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('not found')) {
          console.log(`   ⚠️ Table ${table} does not exist in schema. Skipping data dump.`);
        } else {
          console.error(`   ❌ Error fetching data for ${table}:`, error.message);
        }
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`   ⚠️ Table ${table} has no data. Skipping.`);
        continue;
      }

      console.log(`   ✅ Fetched ${data.length} rows.`);
      sql += `-- Data for public."${table}" (${data.length} rows)\n`;
      sql += `TRUNCATE TABLE public."${table}" CASCADE;\n\n`;

      const columns = Object.keys(data[0]);
      
      // Batch inserts to prevent hitting SQL parser limits
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        sql += `INSERT INTO public."${table}" (${columns.map(c => `"${c}"`).join(', ')})\nVALUES\n`;
        
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
      console.error(`   ❌ Unexpected error on table ${table}:`, err.message || err);
    }
  }

  // 5. CONSTRAINTS & INDEXES
  sql += `-- 8. Apply Constraints & Indexes\n`;
  sql += constraintsDefinitions + `\n\n`;

  // 6. RLS & POLICIES
  sql += `-- 9. Enable RLS and Apply Security Policies\n`;
  sql += policiesContent + `\n\n`;

  // 7. TRIGGERS
  sql += `-- 10. Re-apply Triggers\n`;
  sql += `DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;\n`;
  sql += `CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n\n`;

  sql += `DROP TRIGGER IF EXISTS trg_service_pricing_updated_at ON public.service_pricing;\n`;
  sql += `CREATE TRIGGER trg_service_pricing_updated_at BEFORE UPDATE ON public.service_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();\n\n`;

  sql += `DROP TRIGGER IF EXISTS tr_sync_service_pricing_gross ON public.service_pricing;\n`;
  sql += `CREATE TRIGGER tr_sync_service_pricing_gross BEFORE INSERT OR UPDATE ON public.service_pricing FOR EACH ROW EXECUTE FUNCTION fn_sync_service_pricing_gross();\n\n`;

  sql += `DROP TRIGGER IF EXISTS tr_recalc_service_pricing_on_svc_fee_change ON public.services;\n`;
  sql += `CREATE TRIGGER tr_recalc_service_pricing_on_svc_fee_change AFTER UPDATE OF service_fee ON public.services FOR EACH ROW EXECUTE FUNCTION fn_recalc_service_pricing_on_fee_change();\n\n`;

  sql += `DROP TRIGGER IF EXISTS tr_recalc_service_pricing_on_room_fee_change ON public.room_types;\n`;
  sql += `CREATE TRIGGER tr_recalc_service_pricing_on_room_fee_change AFTER UPDATE OF service_fee ON public.room_types FOR EACH ROW EXECUTE FUNCTION fn_recalc_service_pricing_on_fee_change();\n\n`;

  sql += `SET session_replication_role = 'origin';\n`;

  fs.writeFileSync(outputPath, sql);
  console.log(`\n🎉 Comprehensive database backup successfully written to: ${outputPath}`);
}

main().catch(console.error);
