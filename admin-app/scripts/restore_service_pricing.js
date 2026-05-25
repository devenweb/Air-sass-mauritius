require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Parse SQL INSERT statements from a seed file
 */
async function parseSeedFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  
  // Match all INSERT statements
  const insertRegex = /INSERT INTO "?(?<table>\w+)"?\s*(?:\((?<columns>[^)]+)\))?\s+VALUES\s+(?<values>[\s\S]+?)(?=;|\n\s*--|--|$)/gi;
  
  const results = {};
  
  let match;
  while ((match = insertRegex.exec(content)) !== null) {
    const tableName = match.groups.table;
    const columnsStr = match.groups.columns;
    const valuesStr = match.groups.values;
    
    // Extract column names
    let columns = [];
    if (columnsStr) {
      columns = columnsStr.replace(/"/g, '').split(',').map(col => col.trim());
    }
    
    // Parse the values
    const values = parseSQLValues(valuesStr);
    
    // Convert to array of objects
    const rows = values.map(valueSet => {
      const row = {};
      columns.forEach((col, idx) => {
        row[col] = valueSet[idx];
      });
      return row;
    });
    
    results[tableName] = rows;
  }
  
  return results;
}

/**
 * Parse SQL VALUES clause into an array of value sets
 */
function parseSQLValues(valuesStr) {
  // Remove outer parentheses if they exist
  let cleanValues = valuesStr.trim();
  if (cleanValues.startsWith('(') && cleanValues.endsWith(';')) {
    cleanValues = cleanValues.slice(0, -1);
  }
  
  const result = [];
  let currentGroup = '';
  let parenDepth = 0;
  let inQuotes = false;
  let quoteChar = null;
  let i = 0;

  while (i < cleanValues.length) {
    const char = cleanValues[i];
    
    if (char === '\'' || char === '"') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && cleanValues[i - 1] !== '\\') {
        inQuotes = false;
        quoteChar = null;
      }
      currentGroup += char;
    } else if (!inQuotes) {
      if (char === '(') {
        parenDepth++;
        currentGroup += char;
      } else if (char === ')') {
        parenDepth--;
        currentGroup += char;
        
        // If we're at the top level and encounter a closing parenthesis followed by comma
        if (parenDepth === 0 && cleanValues[i + 1] === ',') {
          // Process this group
          const groupValues = extractValuesFromGroup(currentGroup);
          result.push(groupValues);
          currentGroup = '';
          i += 2; // Skip '),'
          continue;
        }
      } else {
        currentGroup += char;
      }
    } else {
      currentGroup += char;
    }
    
    i++;
  }
  
  // Handle the last group if it exists
  if (currentGroup.trim()) {
    const groupValues = extractValuesFromGroup(currentGroup);
    result.push(groupValues);
  }
  
  return result;
}

/**
 * Extract individual values from a group like (val1, val2, 'val,3')
 */
function extractValuesFromGroup(group) {
  // Remove outer parentheses
  const inner = group.replace(/^\(/, '').replace(/\)$/, '');
  
  const values = [];
  let currentValue = '';
  let parenDepth = 0;
  let inQuotes = false;
  let quoteChar = null;
  let i = 0;

  while (i < inner.length) {
    const char = inner[i];
    
    if (char === '\'' || char === '"') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inner[i - 1] !== '\\') {
        inQuotes = false;
        quoteChar = null;
      }
      currentValue += char;
    } else if (!inQuotes) {
      if (char === '(') {
        parenDepth++;
        currentValue += char;
      } else if (char === ')') {
        parenDepth--;
        currentValue += char;
      } else if (char === ',' && parenDepth === 0) {
        values.push(processSQLValue(currentValue.trim()));
        currentValue = '';
      } else {
        currentValue += char;
      }
    } else {
      currentValue += char;
    }
    
    i++;
  }
  
  // Add the last value if it exists
  if (currentValue.trim()) {
    values.push(processSQLValue(currentValue.trim()));
  }
  
  return values;
}

/**
 * Process a single SQL value (convert NULL, handle quotes, etc.)
 */
function processSQLValue(value) {
  if (value.toUpperCase() === 'NULL') return null;
  
  // Handle numeric values
  if (/^[+-]?\d+$/.test(value)) return parseInt(value, 10);
  if (/^[+-]?\d*\.\d+$/.test(value)) return parseFloat(value);
  
  // Handle booleans
  if (value.toUpperCase() === 'TRUE') return true;
  if (value.toUpperCase() === 'FALSE') return false;
  
  // Handle JSON-like structures
  if ((value.startsWith('{') && value.endsWith('}')) || 
      (value.startsWith('[') && value.endsWith(']'))) {
    try {
      return JSON.parse(value.replace(/'/g, '"'));
    } catch (e) {
      // If JSON parsing fails, return as-is but remove quotes if fully quoted
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        return value.substring(1, value.length - 1);
      }
      return value;
    }
  }
  
  // Handle quoted strings
  if ((value.startsWith("'") && value.endsWith("'")) || 
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.substring(1, value.length - 1);
  }
  
  return value;
}

async function restoreServicePricing() {
  console.log('🔍 Starting service pricing restoration process...');
  
  // Step 1: Check if services exist and their categories
  console.log('\n📋 Step 1: Checking services and categories...');
  
  const backupDir = path.resolve(__dirname, '../../../web-app/supabase/backups/sql_2026-05-15');
  const seedFile = path.join(backupDir, 'seed_2026-05-15.sql');
  
  try {
    console.log(`📖 Reading backup data from: ${seedFile}`);
    const backupData = await parseSeedFile(seedFile);
    
    // Get services from backup
    const backupServices = backupData.services || [];
    const backupCategories = backupData.categories || [];
    const backupServiceCategories = backupData.service_categories || [];
    const backupPricing = backupData.service_pricing || [];
    
    console.log(`✅ Found ${backupServices.length} services in backup`);
    console.log(`✅ Found ${backupCategories.length} categories in backup`);
    console.log(`✅ Found ${backupServiceCategories.length} service-category relations in backup`);
    console.log(`✅ Found ${backupPricing.length} pricing entries in backup`);
    
    // Fetch current services from database
    const { data: currentServices, error: servicesError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesError) {
      console.error('❌ Error fetching current services:', servicesError.message);
      return;
    }
    
    console.log(`✅ Found ${currentServices.length} services in current database`);
    
    // Fetch current categories
    const { data: currentCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) {
      console.error('❌ Error fetching current categories:', categoriesError.message);
      return;
    }
    
    console.log(`✅ Found ${currentCategories.length} categories in current database`);
    
    // Step 2: Check service managers or room managers for room types and meal plans
    console.log('\n🏠 Step 2: Checking room types and meal plans...');
    
    const backupRoomTypes = backupData.room_types || [];
    console.log(`✅ Found ${backupRoomTypes.length} room types in backup`);
    
    // Fetch current room types
    const { data: currentRoomTypes, error: roomTypesError } = await supabase
      .from('room_types')
      .select('*');
    
    if (roomTypesError) {
      console.error('❌ Error fetching current room types:', roomTypesError.message);
      return;
    }
    
    console.log(`✅ Found ${currentRoomTypes.length} room types in current database`);
    
    // Step 3: Update prices for each room type variant with proper pricing
    console.log('\n💰 Step 3: Updating pricing with values from backup...');
    
    // Process each pricing entry from the backup
    let updatedCount = 0;
    let insertedCount = 0;
    
    for (const backupPrice of backupPricing) {
      // Check if a similar pricing entry exists in the current database
      const { data: existingPrice, error: lookupError } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_id', backupPrice.service_id)
        .eq('variant_id', backupPrice.variant_id)
        .eq('date_from', backupPrice.date_from)
        .eq('date_to', backupPrice.date_to)
        .limit(1);
      
      if (lookupError) {
        console.error(`❌ Error looking up pricing for service ${backupPrice.service_id}:`, lookupError.message);
        continue;
      }
      
      if (existingPrice && existingPrice.length > 0) {
        // Update existing pricing
        const { error: updateError } = await supabase
          .from('service_pricing')
          .update({
            price: backupPrice.price,
            price_infant: backupPrice.price_infant,
            price_child: backupPrice.price_child,
            price_teen: backupPrice.price_teen,
            service_fee: backupPrice.service_fee,
            net_price: backupPrice.net_price,
            net_price_teen: backupPrice.net_price_teen,
            net_price_child: backupPrice.net_price_child,
            net_price_infant: backupPrice.net_price_infant,
            occupancy_pricing: backupPrice.occupancy_pricing,
            net_occupancy_pricing: backupPrice.net_occupancy_pricing,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPrice[0].id);
        
        if (updateError) {
          console.error(`❌ Error updating pricing for service ${backupPrice.service_id}:`, updateError.message);
        } else {
          console.log(`✅ Updated pricing for service ${backupPrice.service_id}, variant ${backupPrice.variant_id}`);
          updatedCount++;
        }
      } else {
        // Insert new pricing record
        const { error: insertError } = await supabase
          .from('service_pricing')
          .insert([{
            id: backupPrice.id,
            service_id: backupPrice.service_id,
            variant_id: backupPrice.variant_id,
            label: backupPrice.label,
            date_from: backupPrice.date_from,
            date_to: backupPrice.date_to,
            price: backupPrice.price,
            currency: backupPrice.currency,
            price_type: backupPrice.price_type,
            notes: backupPrice.notes,
            price_infant: backupPrice.price_infant,
            price_child: backupPrice.price_child,
            price_teen: backupPrice.price_teen,
            units_available: backupPrice.units_available,
            is_stop_sell: backupPrice.is_stop_sell,
            occupancy_pricing: backupPrice.occupancy_pricing,
            meal_plan_id: backupPrice.meal_plan_id,
            service_fee: backupPrice.service_fee,
            net_price: backupPrice.net_price,
            net_price_teen: backupPrice.net_price_teen,
            net_price_child: backupPrice.net_price_child,
            net_price_infant: backupPrice.net_price_infant,
            net_occupancy_pricing: backupPrice.net_occupancy_pricing
          }]);
        
        if (insertError) {
          console.error(`❌ Error inserting pricing for service ${backupPrice.service_id}:`, insertError.message);
        } else {
          console.log(`✅ Inserted new pricing for service ${backupPrice.service_id}, variant ${backupPrice.variant_id}`);
          insertedCount++;
        }
      }
    }
    
    console.log(`\n📈 Restoration Summary:`);
    console.log(`   • Updated ${updatedCount} existing pricing records`);
    console.log(`   • Inserted ${insertedCount} new pricing records`);
    console.log(`   • Total processed: ${updatedCount + insertedCount}`);
    
    console.log('\n✅ Service pricing restoration completed!');
  } catch (error) {
    console.error('❌ Error during restoration process:', error.message);
  }
}

// Run the restoration process
restoreServicePricing();