const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseSeedServices() {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error("seed.sql not found at", seedPath);
    return {};
  }
  
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  const services = {};
  
  let insideServices = false;
  for (const line of lines) {
    if (line.includes('INSERT INTO public.services') || line.includes('INSERT INTO public."services"')) {
      insideServices = true;
    } else if (line.trim().endsWith(';')) {
      insideServices = false;
    } else if (insideServices) {
      const trimmed = line.trim();
      if (trimmed.startsWith('(')) {
        const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([^']+)'/i);
        if (matches) {
          services[matches[1]] = matches[2];
        }
      }
    }
  }
  return services;
}

async function main() {
  const seedServices = parseSeedServices();
  const seedCount = Object.keys(seedServices).length;
  console.log(`Parsed ${seedCount} services from seed.sql.`);
  
  console.log("Fetching live services...");
  const { data: liveServices, error } = await supabase
    .from('services')
    .select('id, name');
    
  if (error) {
    console.error("Error fetching live services:", error);
    return;
  }
  
  console.log(`Found ${liveServices.length} services in the live DB.`);
  
  const liveByName = {};
  liveServices.forEach(s => {
    const norm = s.name.trim().toLowerCase();
    if (!liveByName[norm]) {
      liveByName[norm] = [];
    }
    liveByName[norm].push(s);
  });
  
  let exactMatchSameId = 0;
  let exactMatchDiffId = [];
  let noMatch = [];
  
  for (const [seedId, seedName] of Object.entries(seedServices)) {
    const norm = seedName.trim().toLowerCase();
    const liveMatches = liveByName[norm];
    
    if (liveMatches) {
      const sameIdMatch = liveMatches.find(m => m.id === seedId);
      if (sameIdMatch) {
        exactMatchSameId++;
      } else {
        exactMatchDiffId.push({
          name: seedName,
          seedId,
          liveIds: liveMatches.map(m => m.id)
        });
      }
    } else {
      noMatch.push({ seedId, name: seedName });
    }
  }
  
  console.log(`\n=== Match Summary ===`);
  console.log(`- Services with exact match and SAME UUID: ${exactMatchSameId}`);
  console.log(`- Services with exact match but DIFFERENT UUID: ${exactMatchDiffId.length}`);
  console.log(`- Services in seed.sql with NO MATCH in live DB: ${noMatch.length}`);
  
  if (exactMatchDiffId.length > 0) {
    console.log(`\nSample of different UUID matches (first 10):`);
    exactMatchDiffId.slice(0, 10).forEach(m => {
      console.log(`- Name: "${m.name}"`);
      console.log(`  Seed UUID: ${m.seedId}`);
      console.log(`  Live UUID(s): ${m.liveIds.join(', ')}`);
    });
  }
  
  if (noMatch.length > 0) {
    console.log(`\nSample of unmatched services (first 10):`);
    noMatch.slice(0, 10).forEach(m => {
      console.log(`- "${m.name}" (UUID: ${m.seedId})`);
    });
  }
}

main().catch(console.error);
