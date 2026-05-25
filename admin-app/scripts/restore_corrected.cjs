require('dotenv').config(); // Load environment variables

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Parse SQL INSERT statements from a seed file
 */
function parseSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Updated regex to handle "public." prefix and ON CONFLICT clauses
  const insertRegex = /INSERT INTO public\.(\w+) \(([^)]+)\) VALUES\s*(.+?)(?:\s+ON CONFLICT|$)/gs;
  const results = [];
  
  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const columns = match[2].split(',').map(col => col.trim().replace(/"/g, ''));
    const valuesSection = match[3].trim();
    
    // Handle multiple rows in VALUES
    const rowRegex = /\((.*?)\)/gs;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(valuesSection)) !== null) {
      const rawValues = rowMatch[1];
      
      // More sophisticated value parsing to handle various formats
      const values = parseValues(rawValues);
      
      if (columns.length === values.length) {
        const record = {};
        columns.forEach((col, idx) => {
          record[col] = values[idx];
        });
        
        // Only store records from tables we're interested in
        if (['services', 'categories', 'service_pricing', 'room_types'].includes(tableName)) {
          results.push({
            table: tableName,
            data: record
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * Parse individual values from a VALUES clause, handling various formats
 */
function parseValues(valuesStr) {
  const values = [];
  let currentVal = '';
  let inQuotes = false;
  let quoteChar = null;
  let escapeNext = false;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    
    if (escapeNext) {
      currentVal += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (!inQuotes && (char === "'" || char === '"')) {
      inQuotes = true;
      quoteChar = char;
      continue;
    }
    
    if (inQuotes && char === quoteChar) {
      inQuotes = false;
      quoteChar = null;
      continue;
    }
    
    if (!inQuotes && char === ',') {
      values.push(normalizeValue(currentVal.trim()));
      currentVal = '';
      continue;
    }
    
    currentVal += char;
  }
  
  if (currentVal.trim() !== '') {
    values.push(normalizeValue(currentVal.trim()));
  }
  
  return values;
}

/**
 * Normalize parsed values to correct types
 */
function normalizeValue(value) {
  if (value === null || value === undefined) return null;
  if (value === 'NULL' || value === 'null') return null;
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.substring(1, value.length - 1).replace(/''/g, "'");
  }
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }
  return value;
}

/**
 * Parse data from JSON backup files
 */
function parseJsonBackup(backupDir) {
  const results = [];
  
  // Read the data subdirectory
  const dataDir = path.join(backupDir, 'data');
  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory does not exist: ${dataDir}`);
    return results;
  }
  
  const jsonFiles = fs.readdirSync(dataDir);
  
  for (const file of jsonFiles) {
    if (file.endsWith('.json')) {
      const filePath = path.join(dataDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Extract table name from filename (remove .json)
      const tableName = file.replace('.json', '');
      
      // Only process tables we're interested in
      if (['services', 'categories', 'service_pricing', 'room_types'].includes(tableName)) {
        if (Array.isArray(content)) {
          for (const record of content) {
            results.push({
              table: tableName,
              data: record
            });
          }
        }
      }
    }
  }
  
  return results;
}

/**
 * Update existing pricing records with values from backup
 */
async function updatePricingWithBackup(pricingData) {
  let updatedCount = 0;
  
  for (const pricingRecord of pricingData) {
    // Attempt to update the pricing record based on service_id and variant_id
    const { error: pricingError } = await supabase
      .from('service_pricing')
      .update({
        price: pricingRecord.price,
        currency: pricingRecord.currency,
        price_type: pricingRecord.price_type,
        label: pricingRecord.label,
        date_from: pricingRecord.date_from,
        date_to: pricingRecord.date_to,
        price_infant: pricingRecord.price_infant,
        price_child: pricingRecord.price_child,
        price_teen: pricingRecord.price_teen,
        occupancy_pricing: pricingRecord.occupancy_pricing,
        notes: pricingRecord.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', pricingRecord.id);

    if (pricingError) {
      console.error('Error updating service_pricing:', pricingError);
      // Try to insert if update fails (record doesn't exist)
      const { error: insertError } = await supabase
        .from('service_pricing')
        .insert({
          id: pricingRecord.id,
          service_id: pricingRecord.service_id,
          variant_id: pricingRecord.variant_id,
          label: pricingRecord.label,
          date_from: pricingRecord.date_from,
          date_to: pricingRecord.date_to,
          price: pricingRecord.price,
          currency: pricingRecord.currency,
          price_type: pricingRecord.price_type,
          notes: pricingRecord.notes,
          created_at: pricingRecord.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          price_infant: pricingRecord.price_infant,
          price_child: pricingRecord.price_child,
          price_teen: pricingRecord.price_teen,
          units_available: pricingRecord.units_available,
          is_stop_sell: pricingRecord.is_stop_sell,
          occupancy_pricing: pricingRecord.occupancy_pricing,
          meal_plan_id: pricingRecord.meal_plan_id,
          service_fee: pricingRecord.service_fee,
          net_price: pricingRecord.net_price,
          net_price_teen: pricingRecord.net_price_teen,
          net_price_child: pricingRecord.net_price_child,
          net_price_infant: pricingRecord.net_price_infant,
          net_occupancy_pricing: pricingRecord.net_occupancy_pricing
        });
      
      if (!insertError) {
        updatedCount++;
      }
    } else {
      updatedCount++; // Count updates as well
    }
  }
  
  return updatedCount;
}

/**
 * Restore from a specific backup date
 */
async function restoreFromBackupDate(backupDate) {
  console.log(`Attempting to restore from backup: ${backupDate}`);
  
  // Construct the backup directory path more reliably
  const adminAppDir = __dirname; // This is the scripts directory
  const adminAppRoot = path.dirname(adminAppDir); // Go up one level to admin-app
  const webAppRoot = path.join(adminAppRoot, '..', 'web-app'); // Go to web-app
  const backupDir = path.join(webAppRoot, 'supabase', 'backups', backupDate);
  
  // Check if the backup directory exists
  if (!fs.existsSync(backupDir)) {
    console.error(`Backup directory does not exist: ${backupDir}`);
    return false;
  }
  
  let backupData = [];
  
  if (backupDate.includes('sql_')) {
    // SQL format: look for seed_YYYY-MM-DD.sql in the backup directory
    const datePart = backupDate.replace('sql_', '');
    const seedFile = path.join(backupDir, `seed_${datePart}.sql`);
    
    if (!fs.existsSync(seedFile)) {
      console.error(`Seed file does not exist: ${seedFile}`);
      console.log(`Available files in ${backupDir}:`, fs.readdirSync(backupDir));
      return false;
    }
    
    console.log(`Parsing SQL seed file: ${seedFile}`);
    backupData = parseSqlFile(seedFile);
  } else {
    // JSON format: look for data subdirectory with JSON files
    const dataDir = path.join(backupDir, 'data');
    if (!fs.existsSync(dataDir)) {
      console.error(`Data directory does not exist: ${dataDir}`);
      console.log(`Available items in ${backupDir}:`, fs.readdirSync(backupDir));
      return false;
    }
    
    console.log(`Parsing JSON backup from: ${dataDir}`);
    backupData = parseJsonBackup(backupDir);
  }
  
  // Separate data by table
  const services = backupData.filter(item => item.table === 'services').map(item => item.data);
  const categories = backupData.filter(item => item.table === 'categories').map(item => item.data);
  const pricing = backupData.filter(item => item.table === 'service_pricing').map(item => item.data);
  const roomTypes = backupData.filter(item => item.table === 'room_types').map(item => item.data);
  
  console.log(`Found in backup: ${services.length} services, ${categories.length} categories, ${pricing.length} pricing records, ${roomTypes.length} room types`);
  
  if (pricing.length > 0) {
    // Update pricing records with values from backup
    const updatedCount = await updatePricingWithBackup(pricing);
    console.log(`Updated/Inserted ${updatedCount} pricing records from backup ${backupDate}`);
    return true;
  } else {
    console.log(`No pricing records found in backup ${backupDate}, skipping.`);
    return false;
  }
}

/**
 * Main function to try different backups until we find the correct one
 */
async function tryMultipleBackups() {
  // List of backup dates to try, ordered chronologically
  const backupDates = [
    '2026-05-03T19-29',  // JSON format
    '2026-05-07T13-18',  // JSON format
    '2026-05-07T13-28',  // JSON format
    '2026-05-07T14-33',  // JSON format
    '2026-05-18T14-42',  // JSON format
    'sql_2026-05-15',    // SQL format (likely has pricing)
    'sql_2026-05-16',    // SQL format
    'sql_2026-05-19'     // SQL format
  ];
  
  console.log('Starting to try multiple backups to find the correct pricing data...');
  
  for (const backupDate of backupDates) {
    console.log(`\n--- Trying backup: ${backupDate} ---`);
    
    try {
      const success = await restoreFromBackupDate(backupDate);
      if (success) {
        console.log(`Successfully processed backup: ${backupDate}`);
        console.log(`Please check the application to see if this backup has the correct pricing.`);
        console.log(`If not, we'll try the next backup in the sequence.\n`);
        
        // You could add a pause here to check the results before continuing
        // await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      } else {
        console.log(`No pricing records to update in backup: ${backupDate}`);
      }
    } catch (error) {
      console.error(`Error processing backup ${backupDate}:`, error);
    }
  }
  
  console.log('\nCompleted trying all available backups.');
  console.log('If none had the correct pricing, you may need to check other backup sources.');
}

// Run the function
tryMultipleBackups()
  .then(() => console.log('Restore process completed'))
  .catch(error => console.error('Error during restore process:', error));