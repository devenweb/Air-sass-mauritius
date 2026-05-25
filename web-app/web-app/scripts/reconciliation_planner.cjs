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
  // Remove suffixes like (From Backup: May 19), (Different Pricing), etc.
  let cleaned = name.replace(/\s*\([^)]+\)\s*$/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim().toLowerCase();
  return cleaned;
}

function parseSeedData() {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error("seed.sql not found");
    return { services: {}, roomTypes: {} };
  }
  
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  
  const services = {};  // id -> name
  const roomTypes = {}; // id -> { name, serviceId }
  
  let currentTable = null;
  
  for (const line of lines) {
    if (line.includes('INSERT INTO public.services') || line.includes('INSERT INTO public."services"')) {
      currentTable = 'services';
    } else if (line.includes('INSERT INTO public.room_types') || line.includes('INSERT INTO public."room_types"')) {
      currentTable = 'room_types';
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
        } else if (currentTable === 'room_types') {
          // Format: ('id', 'service_id', 'name', ...
          const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([a-f0-9-]{36})'\s*,\s*'([^']+)'/i);
          if (matches) {
            roomTypes[matches[1]] = { name: matches[3], serviceId: matches[2] };
          }
        }
      }
    }
  }
  
  return { services, roomTypes };
}

async function main() {
  const seed = parseSeedData();
  console.log(`Parsed ${Object.keys(seed.services).length} services and ${Object.keys(seed.roomTypes).length} room types from seed.sql.`);
  
  console.log("Fetching live services and room types...");
  const { data: liveServices, error: sErr } = await supabase.from('services').select('id, name');
  const { data: liveRoomTypes, error: rErr } = await supabase.from('room_types').select('id, service_id, name');
  
  if (sErr || rErr) {
    console.error("Error fetching live data:", sErr || rErr);
    return;
  }
  
  console.log(`Live DB: ${liveServices.length} services, ${liveRoomTypes.length} room types.`);
  
  // Build live map by clean name
  const liveServicesByClean = {};
  liveServices.forEach(s => {
    const clean = cleanName(s.name);
    if (!liveServicesByClean[clean]) liveServicesByClean[clean] = [];
    liveServicesByClean[clean].push(s);
  });
  
  const liveRoomTypesByServiceAndClean = {}; // serviceId -> cleanName -> [roomType]
  liveRoomTypes.forEach(r => {
    if (!liveRoomTypesByServiceAndClean[r.service_id]) {
      liveRoomTypesByServiceAndClean[r.service_id] = {};
    }
    const clean = cleanName(r.name);
    if (!liveRoomTypesByServiceAndClean[r.service_id][clean]) {
      liveRoomTypesByServiceAndClean[r.service_id][clean] = [];
    }
    liveRoomTypesByServiceAndClean[r.service_id][clean].push(r);
  });
  
  // Resolve mappings
  const serviceMapping = {}; // seedId -> liveId
  let mappedServicesCount = 0;
  
  for (const [seedId, seedName] of Object.entries(seed.services)) {
    const cleanSeed = cleanName(seedName);
    
    // First, try exact UUID match
    const liveExactId = liveServices.find(s => s.id === seedId);
    if (liveExactId) {
      serviceMapping[seedId] = seedId;
      mappedServicesCount++;
      continue;
    }
    
    // Second, match by clean name
    const matches = liveServicesByClean[cleanSeed];
    if (matches && matches.length > 0) {
      // Pick the first one (or primary one without backup suffix if possible)
      const bestMatch = matches.find(m => !m.name.includes('Backup') && !m.name.includes('JSON')) || matches[0];
      serviceMapping[seedId] = bestMatch.id;
      mappedServicesCount++;
    }
  }
  
  console.log(`Mapped services: ${mappedServicesCount} / ${Object.keys(seed.services).length}`);
  
  // Resolve room types
  const roomTypeMapping = {}; // seedId -> liveId
  let mappedRoomTypesCount = 0;
  
  for (const [seedRtId, seedRt] of Object.entries(seed.roomTypes)) {
    const seedSvcId = seedRt.serviceId;
    const liveSvcId = serviceMapping[seedSvcId];
    
    if (!liveSvcId) continue;
    
    // First, try exact UUID match
    const liveExactId = liveRoomTypes.find(r => r.id === seedRtId);
    if (liveExactId) {
      roomTypeMapping[seedRtId] = seedRtId;
      mappedRoomTypesCount++;
      continue;
    }
    
    // Second, match by clean name under the mapped service
    const cleanRtName = cleanName(seedRt.name);
    const rtMatches = liveRoomTypesByServiceAndClean[liveSvcId]?.[cleanRtName];
    if (rtMatches && rtMatches.length > 0) {
      roomTypeMapping[seedRtId] = rtMatches[0].id;
      mappedRoomTypesCount++;
    }
  }
  
  console.log(`Mapped room types: ${mappedRoomTypesCount} / ${Object.keys(seed.roomTypes).length}`);
}

main().catch(console.error);
