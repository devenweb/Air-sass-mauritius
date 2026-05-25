import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeValue(value: string): any {
  value = value.trim();
  if (value === 'NULL' || value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  let isJsonb = false;
  if (value.endsWith('::jsonb')) {
    value = value.substring(0, value.length - 7).trim();
    isJsonb = true;
  }
  
  if (value.startsWith("'") && value.endsWith("'")) {
    const strVal = value.substring(1, value.length - 1).replace(/''/g, "'");
    if (isJsonb) {
      try {
        return JSON.parse(strVal);
      } catch (e) {
        return strVal;
      }
    }
    return strVal;
  }
  
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

async function testServices() {
  const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  const parts = sql.split('INSERT INTO public.');

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    const firstParenClose = part.indexOf(')');
    if (firstParenClose === -1) continue;

    const tableNameAndCols = part.substring(0, firstParenClose + 1).trim();
    const tableNameMatch = tableNameAndCols.match(/^(\w+)\s*\((.+)\)$/s);
    if (!tableNameMatch) continue;

    const tableName = tableNameMatch[1];
    if (tableName !== 'services') continue;

    const columns = tableNameMatch[2].split(',').map(c => c.trim().replace(/["']/g, ''));
    
    // Scan valuesSection
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
    console.log(`Found services batch with ${rawRows.length} rows.`);

    const record = {};
    const rawRow = rawRows[0];
    const rawValues = parseRowValues(rawRow);
    columns.forEach((col, idx) => {
      record[col] = normalizeValue(rawValues[idx]);
    });

    console.log('Attempting to insert first record:');
    console.log(JSON.stringify(record, null, 2).substring(0, 1000));

    const { data, error } = await supabase.from('services').insert([record]);
    if (error) {
      console.error('❌ Insert Error:', error);
    } else {
      console.log('✅ Inserted service successfully!');
    }
    
    // Stop after the first services batch
    break;
  }
}

testServices().catch(console.error);
