import * as fs from 'fs';
import * as path from 'path';

const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
const sql = fs.readFileSync(seedPath, 'utf8');

const parts = sql.split('INSERT INTO public.');

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
  
  // Get first row
  const rawRows = parseRows(valuesSection);
  const rowStr = rawRows[0];
  
  const rawValues = parseRowValues(rowStr);
  
  console.log('Columns and Raw Values comparison:');
  columns.forEach((col, idx) => {
    console.log(`${idx}: col="${col}" -> raw="${rawValues[idx]}"`);
  });
  
  break;
}
