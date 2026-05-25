const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const isTest = process.argv.includes('--test');
const isCommit = process.argv.includes('--commit');

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
  if (!isTest && !isCommit) {
    console.log("Please run this script with either --test or --commit flag.");
    console.log("Example: node scripts/reconcile_pricing_write_by_id.cjs --test");
    return;
  }

  const seed = parseSeedData();
  console.log(`Parsed ${Object.keys(seed.services).length} services, ${Object.keys(seed.roomTypes).length} room types, and ${seed.pricing.length} pricing records from seed.sql.`);
  
  const { data: liveServices } = await supabase.from('services').select('id, name');
  const { data: liveRoomTypes } = await supabase.from('room_types').select('id, service_id, name');
  liveServices.sort((a, b) => a.id.localeCompare(b.id));
  liveRoomTypes.sort((a, b) => a.id.localeCompare(b.id));
  
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
  
  const toInsert = [];
  const toUpdate = [];
  const usedLiveIds = new Set();
  const matchedPriceMap = new Map(); // seedPrice -> livePrice
  
  // Pass 1: Match by exact ID
  for (const seedPrice of seed.pricing) {
    const liveSvcId = serviceMapping[seedPrice.service_id];
    if (!liveSvcId) continue;
    
    let liveVariantId = seedPrice.variant_id;
    if (seedPrice.variant_id && roomTypeMapping[seedPrice.variant_id]) {
      liveVariantId = roomTypeMapping[seedPrice.variant_id];
    }
    
    const livePrice = livePricingMapById.get(seedPrice.id);
    if (livePrice && livePrice.service_id === liveSvcId && livePrice.variant_id === liveVariantId) {
      matchedPriceMap.set(seedPrice, livePrice);
      usedLiveIds.add(livePrice.id);
    }
  }
  
  // Pass 2: Match remaining by key
  for (const seedPrice of seed.pricing) {
    const liveSvcId = serviceMapping[seedPrice.service_id];
    if (!liveSvcId) continue;
    
    if (matchedPriceMap.has(seedPrice)) continue;
    
    let liveVariantId = seedPrice.variant_id;
    if (seedPrice.variant_id && roomTypeMapping[seedPrice.variant_id]) {
      liveVariantId = roomTypeMapping[seedPrice.variant_id];
    }
    
    const key = `${liveSvcId}|${liveVariantId || ''}|${(seedPrice.label || '').trim().toLowerCase()}|${seedPrice.date_from}|${seedPrice.date_to}|${seedPrice.meal_plan_id || ''}`;
    const candidates = livePricingMapByKey.get(key) || [];
    const livePrice = candidates.find(c => !usedLiveIds.has(c.id));
    if (livePrice) {
      matchedPriceMap.set(seedPrice, livePrice);
      usedLiveIds.add(livePrice.id);
    }
  }
  
  // Now evaluate differences and compile updates and inserts
  for (const seedPrice of seed.pricing) {
    const liveSvcId = serviceMapping[seedPrice.service_id];
    if (!liveSvcId) continue;
    
    let liveVariantId = seedPrice.variant_id;
    if (seedPrice.variant_id && roomTypeMapping[seedPrice.variant_id]) {
      liveVariantId = roomTypeMapping[seedPrice.variant_id];
    }
    
    const fields = {
      service_id: liveSvcId,
      variant_id: liveVariantId,
      label: seedPrice.label,
      date_from: seedPrice.date_from,
      date_to: seedPrice.date_to,
      net_price: seedPrice.net_price,
      net_price_teen: seedPrice.net_price_teen,
      net_price_child: seedPrice.net_price_child,
      net_price_infant: seedPrice.net_price_infant,
      price: seedPrice.price,
      price_teen: seedPrice.price_teen,
      price_child: seedPrice.price_child,
      price_infant: seedPrice.price_infant,
      currency: seedPrice.currency,
      price_type: seedPrice.price_type,
      units_available: seedPrice.units_available,
      is_stop_sell: seedPrice.is_stop_sell,
      meal_plan_id: seedPrice.meal_plan_id,
      service_fee: seedPrice.service_fee,
      notes: seedPrice.notes,
      net_occupancy_pricing: seedPrice.net_occupancy_pricing ? JSON.parse(seedPrice.net_occupancy_pricing) : null,
      occupancy_pricing: seedPrice.occupancy_pricing ? JSON.parse(seedPrice.occupancy_pricing) : null,
      capacity: seedPrice.capacity,
      duration: seedPrice.duration,
      duration_type: seedPrice.duration_type
    };
    
    const livePrice = matchedPriceMap.get(seedPrice);
    if (livePrice) {
      const d1 = Math.abs(livePrice.net_price - seedPrice.net_price);
      const d2 = Math.abs(livePrice.net_price_teen - seedPrice.net_price_teen);
      const d3 = Math.abs(livePrice.net_price_child - seedPrice.net_price_child);
      const d4 = Math.abs(livePrice.net_price_infant - seedPrice.net_price_infant);
      
      if (d1 >= 0.01 || d2 >= 0.01 || d3 >= 0.01 || d4 >= 0.01) {
        toUpdate.push({ id: livePrice.id, fields });
      }
    } else {
      if (!livePricingMapById.has(seedPrice.id)) {
        fields.id = seedPrice.id;
      }
      toInsert.push(fields);
    }
  }
  
  console.log(`\n=== Action Summary (ID-based) ===`);
  console.log(`- Inserts needed: ${toInsert.length}`);
  console.log(`- Updates needed: ${toUpdate.length}`);
  
  if (isTest) {
    console.log(`\n=== TEST MODE ===`);
    console.log("Performing 3 test updates...");
    const testUpdates = toUpdate.slice(0, 3);
    for (const update of testUpdates) {
      const { data, error } = await supabase
        .from('service_pricing')
        .update(update.fields)
        .eq('id', update.id)
        .select();
        
      if (error) {
        console.error(`Update failed for ${update.id}:`, error);
      } else {
        console.log(`Successfully updated record ID ${update.id}`);
      }
    }
  } else if (isCommit) {
    console.log(`\n=== Committing ${toUpdate.length} updates and ${toInsert.length} inserts ===`);
    
    if (toInsert.length > 0) {
      const insertBatchSize = 100;
      for (let i = 0; i < toInsert.length; i += insertBatchSize) {
        const batch = toInsert.slice(i, i + insertBatchSize);
        const { error } = await supabase.from('service_pricing').insert(batch);
        if (error) {
          console.error("Batch insert error:", error);
          process.exit(1);
        }
        console.log(`Inserted batch ${Math.floor(i / insertBatchSize) + 1}`);
      }
    }
    
    if (toUpdate.length > 0) {
      const concurrencyLimit = 20;
      let completed = 0;
      
      const runUpdate = async (update) => {
        const { error } = await supabase
          .from('service_pricing')
          .update(update.fields)
          .eq('id', update.id);
          
        if (error) {
          console.error(`Update error for ${update.id}:`, error);
        } else {
          completed++;
          if (completed % 100 === 0 || completed === toUpdate.length) {
            console.log(`Updated ${completed} / ${toUpdate.length}`);
          }
        }
      };
      
      for (let i = 0; i < toUpdate.length; i += concurrencyLimit) {
        const chunk = toUpdate.slice(i, i + concurrencyLimit);
        await Promise.all(chunk.map(runUpdate));
      }
    }
    console.log("\nReconciliation complete!");
  }
}

main().catch(console.error);
