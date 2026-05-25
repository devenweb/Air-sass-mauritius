const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../supabase/seed.sql');
const content = fs.readFileSync(seedPath, 'utf8');
const lines = content.split('\n');

let insideServices = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('INSERT INTO public.services') || line.includes('INSERT INTO public."services"')) {
    insideServices = true;
  } else if (insideServices) {
    if (line.trim().startsWith('(')) {
      if (line.toLowerCase().includes('ocean')) {
        console.log(`Line ${i + 1}: ${line.slice(0, 150)}...`);
      }
    }
    if (line.trim().endsWith(';')) {
      insideServices = false;
    }
  }
}
