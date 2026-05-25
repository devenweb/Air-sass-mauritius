const fs = require('fs');
const path = require('path');

function parseSeedFile() {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error("seed.sql not found");
    return;
  }
  
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  
  let currentTable = null;
  let undefCount = 0;
  let totalCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('INSERT INTO public.service_pricing') || line.includes('INSERT INTO public."service_pricing"')) {
      currentTable = 'service_pricing';
    } else if (line.trim().endsWith(';')) {
      currentTable = null;
    } else if (currentTable) {
      const trimmed = line.trim();
      if (trimmed.startsWith('(')) {
        totalCount++;
        const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([a-f0-9-]{36})'/i);
        if (!matches) {
          undefCount++;
          if (undefCount <= 5) {
            console.log(`Line ${i + 1} did not match UUID regex:`);
            console.log(trimmed.substring(0, 100) + '...');
          }
        }
      }
    }
  }
  console.log(`\nTotal rows starting with (: ${totalCount}`);
  console.log(`Total rows not matching UUID regex: ${undefCount}`);
}

parseSeedFile();
