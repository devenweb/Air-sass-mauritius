import * as fs from 'fs';
import * as path from 'path';

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

  const valuesIndex = part.indexOf('VALUES');
  if (valuesIndex === -1) continue;

  const rest = part.substring(valuesIndex + 6).trim();
  const semiIndex = rest.indexOf(';');
  if (semiIndex === -1) continue;

  const valuesSection = rest.substring(0, semiIndex).trim();
  
  console.log(`Analyzing services table valuesSection length: ${valuesSection.length}`);
  
  // Let's trace the first 1000 characters
  let depth = 0;
  let inQuotes = false;
  let escapeNext = false;
  let rowCount = 0;
  
  for (let idx = 0; idx < valuesSection.length; idx++) {
    const char = valuesSection[idx];
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
        if (depth === 0) {
          rowCount++;
        }
      }
    }
  }
  
  console.log(`Processed all chars. Final state: depth=${depth}, inQuotes=${inQuotes}, rowCount=${rowCount}`);
}
