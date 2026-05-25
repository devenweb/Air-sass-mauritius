import * as fs from 'fs';
import * as path from 'path';

const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
const sql = fs.readFileSync(seedPath, 'utf8');

const parts = sql.split('INSERT INTO public.');
let count = 0;
for (let i = 1; i < parts.length; i++) {
  const part = parts[i].trim();
  const firstParenClose = part.indexOf(')');
  if (firstParenClose === -1) continue;

  const tableNameAndCols = part.substring(0, firstParenClose + 1).trim();
  const tableNameMatch = tableNameAndCols.match(/^(\w+)\s*\((.+)\)$/s);
  if (!tableNameMatch) continue;

  const tableName = tableNameMatch[1];
  if (tableName === 'service_pricing') {
    const valuesIndex = part.indexOf('VALUES');
    if (valuesIndex !== -1) {
      const rest = part.substring(valuesIndex + 6).trim();
      
      // Let's count rows in this valuesSection
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
      
      // Simple parseRows count
      let rowsCount = 0;
      let subDepth = 0;
      let subInQuotes = false;
      let subEscape = false;
      for (let j = 0; j < valuesSection.length; j++) {
        const char = valuesSection[j];
        if (subEscape) { subEscape = false; continue; }
        if (char === '\\') { subEscape = true; continue; }
        if (char === "'") { subInQuotes = !subInQuotes; continue; }
        if (!subInQuotes) {
          if (char === '(') {
            subDepth++;
          } else if (char === ')') {
            subDepth--;
            if (subDepth === 0) {
              rowsCount++;
            }
          }
        }
      }
      console.log(`Found service_pricing batch with ${rowsCount} rows.`);
      count += rowsCount;
    }
  }
}
console.log(`Total service_pricing rows: ${count}`);
