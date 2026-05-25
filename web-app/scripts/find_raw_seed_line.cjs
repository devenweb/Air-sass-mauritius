const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../supabase/seed.sql');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('0047b758-6dbb-4d08-b428-89570bb7d5ca') || lines[i].includes('0047edc6-f5ad-4b14-9b7d-6f99a1bcfe6f')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
