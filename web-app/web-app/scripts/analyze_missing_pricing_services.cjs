const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseSeedFile() {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error("seed.sql not found at", seedPath);
    return { services: {}, pricing: [] };
  }
  
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  
  const services = {}; // id -> name
  const pricing = [];  // { id, serviceId }
  
  let currentTable = null;
  for (const line of lines) {
    if (line.includes('INSERT INTO public.services') || line.includes('INSERT INTO public."services"')) {
      currentTable = 'services';
    } else if (line.includes('INSERT INTO public.service_pricing') || line.includes('INSERT INTO public."service_pricing"')) {
      currentTable = 'service_pricing';
    } else if (line.trim().endsWith(';')) {
      currentTable = null;
    } else if (currentTable) {
      const trimmed = line.trim();
      if (trimmed.startsWith('(')) {
        if (currentTable === 'services') {
          const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([^']+)'/i);
          if (matches) {
            services[matches[1]] = matches[2];
          }
        } else if (currentTable === 'service_pricing') {
          // Robust regex to extract the first and second UUID in the row
          const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([a-f0-9-]{36})'/i);
          if (matches) {
            pricing.push({ id: matches[1], serviceId: matches[2] });
          }
        }
      }
    }
  }
  
  return { services, pricing };
}

async function main() {
  console.log("Parsing seed.sql...");
  const { services: seedServices, pricing: seedPricing } = parseSeedFile();
  console.log(`Parsed ${Object.keys(seedServices).length} services and ${seedPricing.length} pricing records from seed.sql.`);
  
  console.log("Fetching all service_pricing IDs from the live database...");
  const liveIds = new Set();
  let from = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('service_pricing')
      .select('id')
      .range(from, from + limit - 1);
      
    if (error) {
      console.error("Error fetching live DB pricing IDs:", error);
      break;
    }
    data.forEach(row => liveIds.add(row.id));
    if (data.length < limit) break;
    from += limit;
  }
  console.log(`Found ${liveIds.size} service_pricing IDs in live DB.`);
  
  // Find which seed pricing records are missing from live DB
  const missingPricing = seedPricing.filter(p => !liveIds.has(p.id));
  console.log(`\nFound ${missingPricing.length} pricing records missing in live DB.`);
  
  // Fetch services in live database to get current names for missing pricing
  console.log("Fetching live services list...");
  const { data: liveServices, error: sErr } = await supabase
    .from('services')
    .select('id, name');
  if (sErr) {
    console.error("Error fetching live services:", sErr);
    return;
  }
  const liveServiceMap = new Map();
  liveServices.forEach(s => liveServiceMap.set(s.id, s.name));
  
  // Count missing pricing by service
  const missingCountByService = {};
  missingPricing.forEach(p => {
    const serviceName = liveServiceMap.get(p.service_id) || liveServiceMap.get(p.serviceId) || seedServices[p.serviceId] || `Unknown Service (${p.serviceId})`;
    if (!missingCountByService[serviceName]) {
      missingCountByService[serviceName] = { count: 0, serviceId: p.serviceId };
    }
    missingCountByService[serviceName].count++;
  });
  
  const sortedMissing = Object.entries(missingCountByService)
    .sort((a, b) => b[1].count - a[1].count);
    
  console.log("\n=== Missing Pricing Records Grouped by Service ===");
  sortedMissing.forEach(([name, info]) => {
    console.log(`- ${name} (ID: ${info.serviceId}): ${info.count} records missing`);
  });
}

main().catch(console.error);
