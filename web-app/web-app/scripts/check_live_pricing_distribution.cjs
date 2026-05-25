const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Fetching live service_pricing records...");
  let pricing = [];
  let from = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('service_pricing')
      .select('id, service_id')
      .range(from, from + limit - 1);
      
    if (error) {
      console.error("Error fetching service_pricing:", error);
      break;
    }
    pricing.push(...data);
    if (data.length < limit) break;
    from += limit;
  }
  
  console.log(`Fetched ${pricing.length} pricing records from live DB.`);
  
  console.log("Fetching live services list...");
  const { data: services, error: sErr } = await supabase
    .from('services')
    .select('id, name');
  if (sErr) {
    console.error("Error fetching services:", sErr);
    return;
  }
  const serviceMap = new Map();
  services.forEach(s => serviceMap.set(s.id, s.name));
  
  const counts = {};
  pricing.forEach(p => {
    const name = serviceMap.get(p.service_id) || `Unknown (${p.service_id})`;
    counts[name] = (counts[name] || 0) + 1;
  });
  
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  console.log("\nTop 20 services in live DB by pricing count:");
  sorted.slice(0, 20).forEach(([name, count]) => {
    console.log(`- ${name}: ${count} records`);
  });
}

main().catch(console.error);
