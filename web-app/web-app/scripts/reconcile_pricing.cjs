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
    return { services: {}, roomTypes: {}, pricing: [] };
  }
  
  console.log("Reading and parsing seed.sql...");
  const content = fs.readFileSync(seedPath, 'utf8');
  const lines = content.split('\n');
  
  const services = {};  // id -> name
  const roomTypes = {}; // id -> { name, serviceId }
  const pricing = [];   // array of pricing records
  
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
          const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([^']+)'/i);
          if (matches) {
            services[matches[1]] = matches[2];
          }
        } else if (currentTable === 'room_types') {
          const matches = trimmed.match(/^\(\s*'([a-f0-9-]{36})'\s*,\s*'([a-f0-9-]{36})'\s*,\s*'([^']+)'/i);
          if (matches) {
            roomTypes[matches[1]] = { name: matches[3], serviceId: matches[2] };
          }
        } else if (currentTable === 'service_pricing') {
          // Parse fields using regex or custom parse since the line is SQL values format
          // To be absolutely robust, let's extract values
          // Format is: (id, service_id, variant_id, label, date_from, date_to, net_price, net_price_teen, net_price_child, net_price_infant, price, price_teen, price_child, price_infant, net_occupancy_pricing, occupancy_pricing, currency, price_type, units_available, is_stop_sell, meal_plan_id, service_fee, notes, created_at, updated_at)
          // Wait, let's look at the insert column definition we printed earlier:
          // (id, service_id, variant_id, label, date_from, date_to, price, currency, price_type, notes, created_at, updated_at, price_infant, price_child, price_teen, units_available, is_stop_sell, occupancy_pricing, meal_plan_id, service_fee, net_price, net_price_teen, net_price_child, net_price_infant, net_occupancy_pricing, capacity, duration, duration_type)
          // Let's write a parser that extracts values inside parentheses.
          // Since the values are comma separated and string literals are single-quoted:
          const rowStr = trimmed.endsWith(',') ? trimmed.substring(1, trimmed.length - 2) : trimmed.substring(1, trimmed.length - 1);
          // Split by comma outside single quotes
          const tokens = rowStr.split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(t => t.trim());
          
          if (tokens.length >= 20) {
            const cleanToken = (val) => {
              if (!val || val.toUpperCase() === 'NULL') return null;
              let cleaned = val.trim();
              cleaned = cleaned.replace(/::[a-z0-9_]+$/i, '').trim();
              if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
                cleaned = cleaned.slice(1, -1);
              }
              cleaned = cleaned.replace(/''/g, "'");
              return cleaned;
            };
            
            // Map token indices to columns according to columns definition in seed.sql:
            // 0: id
            // 1: service_id
            // 2: variant_id
            // 3: label
            // 4: date_from
            // 5: date_to
            // 6: price
            // 7: currency
            // 8: price_type
            // 9: notes
            // 10: created_at
            // 11: updated_at
            // 12: price_infant
            // 13: price_child
            // 14: price_teen
            // 15: units_available
            // 16: is_stop_sell
            // 17: occupancy_pricing
            // 18: meal_plan_id
            // 19: service_fee
            // 20: net_price
            // 21: net_price_teen
            // 22: net_price_child
            // 23: net_price_infant
            // 24: net_occupancy_pricing
            // 25: capacity
            // 26: duration
            // 27: duration_type
            
            pricing.push({
              id: cleanToken(tokens[0]),
              service_id: cleanToken(tokens[1]),
              variant_id: cleanToken(tokens[2]),
              label: cleanToken(tokens[3]),
              date_from: cleanToken(tokens[4]),
              date_to: cleanToken(tokens[5]),
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
              net_price: parseFloat(cleanToken(tokens[20])) || 0,
              net_price_teen: parseFloat(cleanToken(tokens[21])) || 0,
              net_price_child: parseFloat(cleanToken(tokens[22])) || 0,
              net_price_infant: parseFloat(cleanToken(tokens[23])) || 0,
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
  console.log(`Parsed ${Object.keys(seed.services).length} services, ${Object.keys(seed.roomTypes).length} room types, and ${seed.pricing.length} pricing records from seed.sql.`);
  
  console.log("Fetching live services and room types...");
  const { data: liveServices, error: sErr } = await supabase.from('services').select('id, name');
  const { data: liveRoomTypes, error: rErr } = await supabase.from('room_types').select('id, service_id, name');
  
  if (sErr || rErr) {
    console.error("Error fetching live data:", sErr || rErr);
    return;
  }
  
  console.log(`Live DB: ${liveServices.length} services, ${liveRoomTypes.length} room types.`);
  
  // Build live maps
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
  
  // Build mapping from seed to live IDs
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
  
  console.log("Fetching live service_pricing records...");
  const livePricingMap = new Map(); // key -> pricing_record
  let from = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('service_pricing')
      .select('*')
      .range(from, from + limit - 1);
      
    if (error) {
      console.error("Error fetching live service_pricing:", error);
      break;
    }
    
    data.forEach(p => {
      // Build lookup key: service_id|variant_id|label|date_from|date_to|meal_plan_id
      const vId = p.variant_id || '';
      const lbl = (p.label || '').trim().toLowerCase();
      const mpId = p.meal_plan_id || '';
      const key = `${p.service_id}|${vId}|${lbl}|${p.date_from}|${p.date_to}|${mpId}`;
      livePricingMap.set(key, p);
    });
    
    if (data.length < limit) break;
    from += limit;
  }
  
  console.log(`Loaded ${livePricingMap.size} pricing records from live DB.`);
  
  // Analyze reconciliation
  let skippedNoService = 0;
  let matchesCleanAndExactPrices = 0;
  let matchesCleanAndDiffPrices = 0;
  let missingInLive = 0;
  
  for (const seedPrice of seed.pricing) {
    const liveSvcId = serviceMapping[seedPrice.service_id];
    if (!liveSvcId) {
      skippedNoService++;
      continue;
    }
    
    // Map variant_id if it's a seed room type ID
    let liveVariantId = seedPrice.variant_id;
    if (seedPrice.variant_id && roomTypeMapping[seedPrice.variant_id]) {
      liveVariantId = roomTypeMapping[seedPrice.variant_id];
    }
    
    const vId = liveVariantId || '';
    const lbl = (seedPrice.label || '').trim().toLowerCase();
    const mpId = seedPrice.meal_plan_id || '';
    const lookupKey = `${liveSvcId}|${vId}|${lbl}|${seedPrice.date_from}|${seedPrice.date_to}|${mpId}`;
    
    const livePrice = livePricingMap.get(lookupKey);
    
    if (livePrice) {
      // Compare prices
      const sameNetPrice = Math.abs(livePrice.net_price - seedPrice.net_price) < 0.01;
      const sameNetPriceTeen = Math.abs(livePrice.net_price_teen - seedPrice.net_price_teen) < 0.01;
      const sameNetPriceChild = Math.abs(livePrice.net_price_child - seedPrice.net_price_child) < 0.01;
      const sameNetPriceInfant = Math.abs(livePrice.net_price_infant - seedPrice.net_price_infant) < 0.01;
      
      if (sameNetPrice && sameNetPriceTeen && sameNetPriceChild && sameNetPriceInfant) {
        matchesCleanAndExactPrices++;
      } else {
        matchesCleanAndDiffPrices++;
      }
    } else {
      missingInLive++;
    }
  }
  
  console.log(`\n=== Dry Run Results ===`);
  console.log(`- Skipped (Service does not exist in live DB): ${skippedNoService}`);
  console.log(`- Exact Match (Exist in live DB with identical prices): ${matchesCleanAndExactPrices}`);
  console.log(`- Update Needed (Exist in live DB but with different prices): ${matchesCleanAndDiffPrices}`);
  console.log(`- Insert Needed (Does not exist in live DB): ${missingInLive}`);
}

main().catch(console.error);
