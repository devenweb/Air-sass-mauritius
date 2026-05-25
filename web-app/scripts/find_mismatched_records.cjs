const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function cleanName(name) {
  if (!name) return '';
  let cleaned = name.replace(/\s*\([^)]+\)\s*$/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim().toLowerCase();
  return cleaned;
}

function parseSeedData() {
  const seedPath = path.join(__dirname, '../supabase/seed.sql');
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  const services = {};
  const roomTypes = {};
  const pricing = [];
  let currentTable = null;
  
  for (const line of lines) {
    if (line.includes('INSERT INTO public.services') || line.includes('INSERT INTO public."services"')) {
      currentTable = 'services';
    } else if (line.includes('INSERT INTO public.room_types') || line.includes('INSERT INTO public."room_types"')) {
      currentTable = 'room_types';
    } else if (line.includes('INSERT INTO public.service_pricing') || line.includes('INSERT INTO public."service_pricing"')) {
      currentTable = 'service_pricing';
    } else if (line.trim().endsWith(';')) {
      currentTable = null;
    } else if (currentTable) {
      const trimmed = line.trim();
      if (trimmed.startsWith('(')) {
        if (currentTable === 'services') {
          const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'((?:[^']|'')*)'/i);
          if (matches) services[matches[1]] = matches[2].replace(/''/g, "'");
        } else if (currentTable === 'room_types') {
          const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([a-f0-9-]{36})'\s*,\s*'((?:[^']|'')*)'/i);
          if (matches) roomTypes[matches[1]] = { name: matches[3].replace(/''/g, "'"), serviceId: matches[2] };
        } else if (currentTable === 'service_pricing') {
          const rowStr = trimmed.endsWith(',') ? trimmed.substring(1, trimmed.length - 2) : trimmed.substring(1, trimmed.length - 1);
          const tokens = rowStr.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(t => t.trim());
          if (tokens.length >= 20) {
            const cleanToken = (val) => {
              if (!val || val.toUpperCase() === 'NULL') return null;
              let cleaned = val.trim();
              cleaned = cleaned.replace(/::[a-z0-9_]+$/i, '').trim();
              if (cleaned.startsWith("'") && cleaned.endsWith("'")) cleaned = cleaned.slice(1, -1);
              cleaned = cleaned.replace(/''/g, "'");
              return cleaned;
            };
            pricing.push({
              id: cleanToken(tokens[0]),
              service_id: cleanToken(tokens[1]),
              variant_id: cleanToken(tokens[2]),
              label: cleanToken(tokens[3]),
              date_from: cleanToken(tokens[4]),
              date_to: cleanToken(tokens[5]),
              net_price: parseFloat(cleanToken(tokens[20])) || 0,
              net_price_teen: parseFloat(cleanToken(tokens[21])) || 0,
              net_price_child: parseFloat(cleanToken(tokens[22])) || 0,
              net_price_infant: parseFloat(cleanToken(tokens[23])) || 0,
              price: parseFloat(cleanToken(tokens[6])) || 0,
              currency: cleanToken(tokens[7]) || 'MUR',
              price_type: cleanToken(tokens[8]) || 'per_person',
              notes: cleanToken(tokens[9]),
              price_infant: parseFloat(cleanToken(tokens[12])) || 0,
              price_child: parseFloat(cleanToken(tokens[13])) || 0,
              price_teen: parseFloat(cleanToken(tokens[14])) || 0,
              units_available: cleanToken(tokens[15]) ? parseInt(cleanToken(tokens[15])) : null,
              is_stop_sell: cleanToken(tokens[16]) === 'true',
              occupancy_pricing: cleanToken(tokens[17]),
              meal_plan_id: cleanToken(tokens[18]),
              service_fee: cleanToken(tokens[19]) ? parseFloat(cleanToken(tokens[19])) : null,
              net_occupancy_pricing: cleanToken(tokens[24]),
              capacity: cleanToken(tokens[25]) ? parseInt(cleanToken(tokens[25])) : null,
              duration: cleanToken(tokens[26]) ? parseInt(cleanToken(tokens[26])) : null,
              duration_type: cleanToken(tokens[27])
            });
          }
        }
      }
    }
  }
  return { services, roomTypes, pricing };
}

async function main() {
  const seed = parseSeedData();
  const { data: liveServices } = await supabase.from('services').select('id, name');
  const { data: liveRoomTypes } = await supabase.from('room_types').select('id, service_id, name');
  
  const liveServicesByClean = {};
  liveServices.forEach(s => {
    const clean = cleanName(s.name);
    if (!liveServicesByClean[clean]) liveServicesByClean[clean] = [];
    liveServicesByClean[clean].push(s);
  });
  
  const liveRoomTypesByServiceAndClean = {};
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
  
  const roomTypeMapping = {};
  for (const [seedRtId, seedRt] of Object.entries(seed.roomTypes)) {
    const seedSvcId = seedRt.serviceId;
    const liveSvcId = serviceMapping[seedSvcId];
    if (!liveSvcId) continue;
    
    const liveExactId = liveRoomTypes.find(r => r.id === seedRtId);
    if (liveExactId) {
      roomTypeMapping[seedRtId] = seedRtId;
      continue;
    }
    
    const cleanRtName = cleanName(seedRt.name);
    const rtMatches = liveRoomTypesByServiceAndClean[liveSvcId]?.[cleanRtName];
    if (rtMatches && rtMatches.length > 0) {
      roomTypeMapping[seedRtId] = rtMatches[0].id;
    }
  }
  
  console.log("Loading live service_pricing records...");
  const livePricingMapById = new Map();
  const livePricingMapByKey = new Map();
  
  let from = 0;
  while (true) {
    const { data } = await supabase.from('service_pricing').select('*').range(from, from + 999);
    if (!data || data.length === 0) break;
    data.forEach(p => {
      livePricingMapById.set(p.id, p);
      const key = `${p.service_id}|${p.variant_id || ''}|${(p.label || '').trim().toLowerCase()}|${p.date_from}|${p.date_to}|${p.meal_plan_id || ''}`;
      if (!livePricingMapByKey.has(key)) {
        livePricingMapByKey.set(key, []);
      }
      livePricingMapByKey.get(key).push(p);
    });
    if (data.length < 1000) break;
    from += 1000;
  }
  
  let matchCount = 0;
  let failCount = 0;
  
  for (const seedPrice of seed.pricing) {
    const liveSvcId = serviceMapping[seedPrice.service_id];
    if (!liveSvcId) continue;
    
    if (cleanName(seed.services[seedPrice.service_id]).includes('ocean')) {
      // Find if this record matches a live record
      let liveVariantId = seedPrice.variant_id;
      if (seedPrice.variant_id && roomTypeMapping[seedPrice.variant_id]) {
        liveVariantId = roomTypeMapping[seedPrice.variant_id];
      }
      
      const livePrice = livePricingMapById.get(seedPrice.id);
      if (livePrice && livePrice.service_id === liveSvcId && livePrice.variant_id === liveVariantId) {
        matchCount++;
      } else {
        failCount++;
        if (failCount <= 5) {
          console.log(`Failed seed price: ID ${seedPrice.id}, service_id in seed: ${seedPrice.service_id}, service_id mapped: ${liveSvcId}`);
          console.log(`Live price record for ID ${seedPrice.id}:`, livePrice);
        }
      }
    }
  }
  console.log(`Oceans: MatchCount=${matchCount}, FailCount=${failCount}`);
}

main().catch(console.error);
