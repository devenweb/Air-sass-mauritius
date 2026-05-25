import * as fs from 'fs';
import * as path from 'path';

const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
const sql = fs.readFileSync(seedPath, 'utf8');

function normalizeValue(value: string): any {
  value = value.trim();
  if (value === 'NULL' || value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  let isJsonb = false;
  if (value.endsWith('::jsonb')) {
    value = value.substring(0, value.length - 8).trim();
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

const parts = sql.split('INSERT INTO public.');
console.log(`Found ${parts.length - 1} INSERT statements in seed.sql.`);

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
  console.log(`Parsed table: ${tableName} with ${columns.length} columns.`);

  const valuesIndex = part.indexOf('VALUES');
  if (valuesIndex === -1) continue;

  const rest = part.substring(valuesIndex + 6).trim();
  
  // Use character-by-character scan to find correct ending semicolon
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
  console.log(`Extracted ${rawRows.length} raw rows from values section.`);

  let mismatchCount = 0;
  for (let rIdx = 0; rIdx < Math.min(5, rawRows.length); rIdx++) {
    const rawRow = rawRows[rIdx];
    const rawValues = parseRowValues(rawRow);
    console.log(`Row ${rIdx + 1}: cols=${columns.length}, values=${rawValues.length}`);
    if (columns.length !== rawValues.length) {
      mismatchCount++;
    }
  }
  
  for (const rawRow of rawRows) {
    const rawValues = parseRowValues(rawRow);
    if (columns.length !== rawValues.length) {
      mismatchCount++;
    }
  }
  console.log(`Total mismatch rows in services: ${mismatchCount}`);
}
