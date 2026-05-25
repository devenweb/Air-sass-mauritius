const fs = require('fs');
const path = require('path');

function main() {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error("seed.sql not found");
    return;
  }
  
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  
  let currentTable = null;
  let linesPrinted = 0;
  
  for (const line of lines) {
    if (line.includes('INSERT INTO public.service_pricing') || line.includes('INSERT INTO public."service_pricing"')) {
      currentTable = 'service_pricing';
      console.log("=== Column Definition ===");
      console.log(line);
      linesPrinted = 0;
    } else if (currentTable) {
      if (line.trim().startsWith('(')) {
        console.log("=== Row Sample ===");
        console.log(line);
        linesPrinted++;
        if (linesPrinted >= 5) {
          break;
        }
      }
      if (line.trim().endsWith(';')) {
        currentTable = null;
      }
    }
  }
}

main();
