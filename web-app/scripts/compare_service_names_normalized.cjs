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
  // Remove suffixes like (From Backup: May 19), (Different Pricing), (Saturday Offer), etc.
  let cleaned = name.replace(/\s*\([^)]+\)\s*$/gi, '');
  // Normalize spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim().toLowerCase();
  return cleaned;
}

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
  console.log(`Parsed ${Object.keys(seedServices).length} services from seed.sql.`);
  
  console.log("Fetching live services...");
  const { data: liveServices, error } = await supabase
    .from('services')
    .select('id, name');
    
  if (error) {
    console.error("Error fetching live services:", error);
    return;
  }
  
  console.log(`Found ${liveServices.length} services in the live DB.`);
  
  const liveByCleanName = {};
  liveServices.forEach(s => {
    const clean = cleanName(s.name);
    if (!liveByCleanName[clean]) {
      liveByCleanName[clean] = [];
    }
    liveByCleanName[clean].push(s);
  });
  
  let matchSameId = 0;
  let matchDiffId = [];
  let noMatch = [];
  
  for (const [seedId, seedName] of Object.entries(seedServices)) {
    const cleanSeed = cleanName(seedName);
    const liveMatches = liveByCleanName[cleanSeed];
    
    if (liveMatches) {
      const sameIdMatch = liveMatches.find(m => m.id === seedId);
      if (sameIdMatch) {
        matchSameId++;
      } else {
        matchDiffId.push({
          seedName,
          seedId,
          liveMatches: liveMatches.map(m => ({ id: m.id, name: m.name }))
        });
      }
    } else {
      noMatch.push({ seedId, seedName });
    }
  }
  
  console.log(`\n=== Match Summary with Normalized Names ===`);
  console.log(`- Services with clean name match and SAME UUID: ${matchSameId}`);
  console.log(`- Services with clean name match but DIFFERENT UUID: ${matchDiffId.length}`);
  console.log(`- Services in seed.sql with NO MATCH in live DB: ${noMatch.length}`);
  
  if (matchDiffId.length > 0) {
    console.log(`\nSample of different UUID matches (first 15):`);
    matchDiffId.slice(0, 15).forEach(m => {
      console.log(`- Seed Name: "${m.seedName}" (UUID: ${m.seedId})`);
      console.log(`  Live Matches:`);
      m.liveMatches.forEach(lm => {
        console.log(`    * "${lm.name}" (UUID: ${lm.id})`);
      });
    });
  }
  
  if (noMatch.length > 0) {
    console.log(`\nSample of unmatched services (first 15):`);
    noMatch.slice(0, 15).forEach(m => {
      console.log(`- "${m.seedName}" (UUID: ${m.seedId})`);
    });
  }
}

main().catch(console.error);
