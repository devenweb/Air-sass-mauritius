import * as fs from 'fs';
import * as path from 'path';

const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
const sql = fs.readFileSync(seedPath, 'utf8');
const lines = sql.split('\n');

console.log('Lines 315 to 330 of seed.sql:');
for (let i = 314; i < 330; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
