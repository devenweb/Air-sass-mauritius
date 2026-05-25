const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../supabase/seed.sql');
const content = fs.readFileSync(seedPath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('service_pricing')) {
    console.log(`Line ${i + 1}: ${lines[i].substring(0, 120)}`);
  }
}
