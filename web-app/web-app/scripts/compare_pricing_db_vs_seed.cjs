const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse seed.sql to extract service_pricing IDs
function getSeedPricingIds() {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error("seed.sql not found at", seedPath);
    return [];
  }
  
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  const ids = new Set();
  
  let insidePricing = false;
  for (const line of lines) {
    if (line.includes('INSERT INTO public.service_pricing') || line.includes('INSERT INTO public."service_pricing"')) {
      insidePricing = true;
    } else if (insidePricing) {
      const trimmed = line.trim();
      if (trimmed.startsWith('(')) {
        // extract UUID: ('c0c2e3db-7e9b-4b13-88fe-510eead0bf93', ...
        const match = trimmed.match(/^\(\s*'([a-f0-9-]{36})'/i);
        if (match) {
          ids.add(match[1]);
        }
      }
      if (trimmed.endsWith(';')) {
        insidePricing = false;
      }
    }
  }
  return Array.from(ids);
}

async function main() {
  console.log("Parsing seed.sql for service_pricing IDs...");
  const seedIds = getSeedPricingIds();
  console.log(`Found ${seedIds.length} service_pricing IDs in seed.sql.`);
  
  if (seedIds.length === 0) {
    return;
  }
  
  console.log("Fetching all service_pricing IDs from the live database...");
  let liveIds = new Set();
  let from = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('service_pricing')
      .select('id')
      .range(from, from + limit - 1);
      
    if (error) {
      console.error("Error fetching from live DB:", error);
      break;
    }
    data.forEach(row => liveIds.add(row.id));
    if (data.length < limit) break;
    from += limit;
  }
  
  console.log(`Found ${liveIds.size} service_pricing IDs in the live database.`);
  
  // Calculate differences
  const missingInLive = seedIds.filter(id => !liveIds.has(id));
  const uniqueToLive = Array.from(liveIds).filter(id => !seedIds.includes(id));
  
  console.log(`\n=== Pricing Discrepancy Summary ===`);
  console.log(`- In seed.sql only (missing from live DB): ${missingInLive.length}`);
  console.log(`- In live DB only (missing from seed.sql): ${uniqueToLive.length}`);
  
  if (missingInLive.length > 0) {
    console.log(`\nSample of missing IDs in live DB (first 10):`);
    console.log(missingInLive.slice(0, 10));
  }
}

main().catch(console.error);
