import * as fs from 'fs';
import * as path from 'path';

const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
if (!fs.existsSync(seedPath)) {
  console.error('seed.sql not found');
  process.exit(1);
}

const sql = fs.readFileSync(seedPath, 'utf8');
const lines = sql.split('\n');

console.log('Seed SQL lines overview:');
console.log(`Total lines: ${lines.length}`);

// Find all lines starting with -- Data for or INSERT INTO
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('-- Data for')) {
    console.log(`Line ${i + 1}: ${line}`);
  }
}
