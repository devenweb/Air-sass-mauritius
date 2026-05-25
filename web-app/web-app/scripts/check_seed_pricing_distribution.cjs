const fs = require('fs');
const path = require('path');

function main() {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error("seed.sql not found");
    return;
  }
  
  console.log("Reading seed.sql...");
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  
  const services = {}; // id -> name
  const pricingCounts = {}; // serviceId -> count
  
  let currentTable = null;
  let totalPricing = 0;
  
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
          const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([a-f0-9-]{36})'/i);
          if (matches) {
            const serviceId = matches[2];
            pricingCounts[serviceId] = (pricingCounts[serviceId] || 0) + 1;
            totalPricing++;
          }
        }
      }
    }
  }
  
  console.log(`Parsed ${Object.keys(services).length} services and ${totalPricing} pricing records.`);
  
  const grouped = Object.entries(pricingCounts).map(([serviceId, count]) => {
    return {
      serviceId,
      name: services[serviceId] || `Unknown (${serviceId})`,
      count
    };
  }).sort((a, b) => b.count - a.count);
  
  console.log("\nTop 20 services in seed.sql by pricing count:");
  grouped.slice(0, 20).forEach(g => {
    console.log(`- ${g.name}: ${g.count} pricing records`);
  });
}

main();
