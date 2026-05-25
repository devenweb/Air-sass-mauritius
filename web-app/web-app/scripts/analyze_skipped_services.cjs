const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function cleanName(name) {
  if (!name) return '';
  let cleaned = name.replace(/\s*\([^)]+\)\s*$/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim().toLowerCase();
  return cleaned;
}

function parseSeedData() {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error("seed.sql not found");
    return { services: {}, pricing: [] };
  }
  
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  
  const services = {};  // id -> name
  const pricing = [];   // array of pricing records
  
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
          const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([a-f0-9-]{36})'/i);
          if (matches) {
            pricing.push({
              id: matches[1],
              service_id: matches[2]
            });
          }
        }
      }
    }
  }
  
  return { services, pricing };
}

async function main() {
  const seed = parseSeedData();
  
  console.log("Fetching live services...");
  const { data: liveServices, error } = await supabase.from('services').select('id, name');
  if (error) {
    console.error(error);
    return;
  }
  
  const liveServicesByClean = {};
  liveServices.forEach(s => {
    const clean = cleanName(s.name);
    if (!liveServicesByClean[clean]) liveServicesByClean[clean] = [];
    liveServicesByClean[clean].push(s);
  });
  
  // Mapping
  const serviceMapping = {};
  for (const [seedId, seedName] of Object.entries(seed.services)) {
    const cleanSeed = cleanName(seedName);
    const liveExactId = liveServices.find(s => s.id === seedId);
    if (liveExactId) {
      serviceMapping[seedId] = seedId;
      continue;
    }
    const matches = liveServicesByClean[cleanSeed];
    if (matches && matches.length > 0) {
      const bestMatch = matches.find(m => !m.name.includes('Backup') && !m.name.includes('JSON')) || matches[0];
      serviceMapping[seedId] = bestMatch.id;
    }
  }
  
  // Count skipped pricing by seed service name
  const skippedCounts = {};
  seed.pricing.forEach(p => {
    const liveSvcId = serviceMapping[p.service_id];
    if (!liveSvcId) {
      const seedName = seed.services[p.service_id] || `Unknown (${p.service_id})`;
      skippedCounts[seedName] = (skippedCounts[seedName] || 0) + 1;
    }
  });
  
  const sorted = Object.entries(skippedCounts).sort((a, b) => b[1] - a[1]);
  console.log("\n=== Top Skipped Services by Pricing Count ===");
  sorted.forEach(([name, count]) => {
    console.log(`- ${name}: ${count} pricing records skipped`);
  });
}

main().catch(console.error);
