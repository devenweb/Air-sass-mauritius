const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../supabase/seed.sql');
const content = fs.readFileSync(seedPath, 'utf8');
const lines = content.split('\n');

console.log("Services matching 'Ocean' or 'Creek' in seed.sql:");
let insideServices = false;
for (const line of lines) {
  if (line.includes('INSERT INTO public.services') || line.includes('INSERT INTO public."services"')) {
    insideServices = true;
  } else if (line.trim().endsWith(';')) {
    insideServices = false;
  } else if (insideServices) {
    if (line.includes('Ocean') || line.includes('Creek')) {
      console.log(line.trim());
    }
  }
}
