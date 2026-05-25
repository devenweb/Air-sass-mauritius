require('dotenv').config(); // Load environment variables
const fs = require('fs');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Copies pricing data directly from backup files without modifications
 */
async function copyPricingFromBackup() {
  console.log("Copying pricing data directly from backup files...\n");
  
  // Define backup directories
  const backupBaseDir = path.join(__dirname, '..', 'supabase', 'backups');
  const backupDirs = fs.readdirSync(backupBaseDir).filter(item => 
    fs.statSync(path.join(backupBaseDir, item)).isDirectory() && 
    item.startsWith('sql_')
  );
  
  const logEntries = [];
  
  for (const backupDir of backupDirs) {
    const backupPath = path.join(backupBaseDir, backupDir);
    const seedFiles = fs.readdirSync(backupPath).filter(file => 
      file.endsWith('.sql') && file.includes('seed')
    );
    
    if (seedFiles.length === 0) {
      console.log(`❌ No seed files found in: ${backupPath}`);
      continue;
    }
    
    const seedFile = seedFiles[0];
    const seedFilePath = path.join(backupPath, seedFile);
    
    console.log(`📦 Processing backup: ${backupDir}/${seedFile}`);
    
    const startTime = new Date().toISOString();
    logEntries.push({
      fileName: `${backupDir}/${seedFile}`,
      startTime: startTime,
      status: 'started'
    });
    
    try {
      // Read the SQL file content
      const sqlContent = fs.readFileSync(seedFilePath, 'utf8');
      
      // Extract service entries from the backup
      const serviceMatches = [...sqlContent.matchAll(/INSERT INTO public\.services [\s\S]*?VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT/g)];
      
      if (serviceMatches.length === 0) {
        console.log(`   ❌ No service entries found in ${seedFile}`);
        continue;
      }
      
      console.log(`   📊 Found ${serviceMatches.length} service entries in ${seedFile}`);
      
      // Process services to map old IDs to new IDs
      const serviceIdMap = new Map();
      
      // Process only the first few services to keep it manageable
      for (let i = 0; i < Math.min(5, serviceMatches.length); i++) {
        const match = serviceMatches[i];
        const valuesStr = match[1];
        const values = parseSimpleSqlValues(valuesStr);
        
        if (values.length >= 2) {
          const originalServiceId = values[0]; // original id from backup
          const serviceName = values[1]; // name
          const serviceDesc = values[2]; // description
          
          // Create a new service based on the backup data
          const newService = {
            name: `${serviceName} (From Backup: ${backupDir})`,
            description: serviceDesc ? `${serviceDesc} (Imported from backup: ${backupDir})` : `(Imported from backup: ${backupDir})`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          try {
            // Insert the new service
            const { data: insertedService, error: insertServiceError } = await supabase
              .from('services')
              .insert([newService])
              .select()
              .single();
            
            if (insertServiceError) {
              console.log(`     ❌ Error creating service from backup ${backupDir}:`, insertServiceError.message);
              continue;
            }
            
            // Map the original service ID to the new service ID
            serviceIdMap.set(originalServiceId, insertedService.id);
            
            console.log(`     ✅ Created service: ${insertedService.name} (New ID: ${insertedService.id}, Original ID: ${originalServiceId})`);
          } catch (err) {
            console.log(`     ❌ Error creating service from backup ${backupDir}:`, err.message);
          }
        }
      }
      
      // Now process the pricing data
      const pricingMatches = [...sqlContent.matchAll(/INSERT INTO public\.service_pricing.*?VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT/g)];
      
      if (pricingMatches.length === 0) {
        console.log(`   ❌ No pricing entries found in ${seedFile}`);
      } else {
        console.log(`   📊 Found ${pricingMatches.length} pricing entries in ${seedFile}`);
        
        // Process only the first few pricing records to keep it manageable
        for (let j = 0; j < Math.min(10, pricingMatches.length); j++) {
          const pMatch = pricingMatches[j];
          const pValuesStr = pMatch[1];
          const pValues = parseSimpleSqlValues(pValuesStr);
          
          if (pValues.length >= 7) {
            // Extract the original service ID from the pricing record
            const originalServiceId = pValues[1];
            
            // Check if we have a mapping for this service ID
            if (serviceIdMap.has(originalServiceId)) {
              const newServiceId = serviceIdMap.get(originalServiceId);
              
              // Create new pricing record with the new service ID and original pricing data
              const newPricing = {
                service_id: newServiceId, // Use the NEW service ID
                variant_id: pValues[2] || null,
                label: pValues[3] || 'Default',
                date_from: pValues[4],
                date_to: pValues[5],
                price: typeof pValues[6] === 'number' ? pValues[6] : 
                       (pValues[6] && !isNaN(parseFloat(pValues[6])) ? parseFloat(pValues[6]) : 0),
                price_child: typeof pValues[11] === 'number' ? pValues[11] : 
                            (pValues[11] && !isNaN(parseFloat(pValues[11])) ? parseFloat(pValues[11]) : 0),
                price_teen: typeof pValues[12] === 'number' ? pValues[12] : 
                           (pValues[12] && !isNaN(parseFloat(pValues[12])) ? parseFloat(pValues[12]) : 0),
                price_infant: typeof pValues[10] === 'number' ? pValues[10] : 
                             (pValues[10] && !isNaN(parseFloat(pValues[10])) ? parseFloat(pValues[10]) : 0),
                currency: pValues[7] || 'Rs',
                price_type: pValues[8] || 'per_person',
                notes: pValues[9] || null,
                units_available: pValues[15] || null,
                is_stop_sell: pValues[16] === 'true',
                // Handle JSON fields safely
                occupancy_pricing: safeParseJson(pValues[17]),
                meal_plan_id: pValues[18] || null,
                service_fee: pValues[19] || null,
                net_price: typeof pValues[20] === 'number' ? pValues[20] : 
                          (pValues[20] && !isNaN(parseFloat(pValues[20])) ? parseFloat(pValues[20]) : 0),
                net_price_teen: typeof pValues[21] === 'number' ? pValues[21] : 
                               (pValues[21] && !isNaN(parseFloat(pValues[21])) ? parseFloat(pValues[21]) : 0),
                net_price_child: typeof pValues[22] === 'number' ? pValues[22] : 
                                (pValues[22] && !isNaN(parseFloat(pValues[22])) ? parseFloat(pValues[22]) : 0),
                net_price_infant: typeof pValues[23] === 'number' ? pValues[23] : 
                                 (pValues[23] && !isNaN(parseFloat(pValues[23])) ? parseFloat(pValues[23]) : 0),
                net_occupancy_pricing: safeParseJson(pValues[24]),
                // Include the newly added columns
                capacity: pValues[25] || 0,
                duration: pValues[26] || null,
                duration_type: pValues[27] || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              
              try {
                // Insert the new pricing record
                const { data: insertedPricing, error: insertPricingError } = await supabase
                  .from('service_pricing')
                  .insert([newPricing])
                  .select()
                  .single();
                
                if (insertPricingError) {
                  console.log(`       ❌ Error inserting pricing for service ${newServiceId}:`, insertPricingError.message);
                } else {
                  console.log(`       ✅ Copied pricing: ${insertedPricing.label} with price: ${insertedPricing.price}`);
                }
              } catch (pricingErr) {
                console.log(`       ❌ Error creating pricing for service ${newServiceId}:`, pricingErr.message);
              }
            } else {
              // If the service ID isn't in our map, skip this pricing record
              console.log(`       ⚠️  Skipping pricing record for unmapped service ID: ${originalServiceId}`);
            }
          }
        }
      }
      
      const endTime = new Date().toISOString();
      const logEntry = logEntries.find(entry => entry.fileName === `${backupDir}/${seedFile}`);
      if (logEntry) {
        logEntry.endTime = endTime;
        logEntry.status = 'completed';
      }
      
      console.log(`   🎉 Completed processing ${backupDir}/${seedFile}\n`);
      
    } catch (error) {
      console.log(`❌ Error processing backup file ${seedFile}:`, error.message);
      
      const endTime = new Date().toISOString();
      const logEntry = logEntries.find(entry => entry.fileName === `${backupDir}/${seedFile}`);
      if (logEntry) {
        logEntry.endTime = endTime;
        logEntry.status = 'failed';
        logEntry.error = error.message;
      }
    }
  }
  
  // Print processing log
  console.log("\n📋 PROCESSING LOG:");
  console.log("===================");
  logEntries.forEach(entry => {
    console.log(`File: ${entry.fileName}`);
    console.log(`  Started:  ${entry.startTime}`);
    console.log(`  Ended:    ${entry.endTime || 'N/A'}`);
    console.log(`  Status:   ${entry.status}`);
    if (entry.error) {
      console.log(`  Error:    ${entry.error}`);
    }
    console.log('');
  });
  
  console.log("\n✅ All backup files processed!");
}

/**
 * Safely parse a JSON string, returning the original value if parsing fails
 */
function safeParseJson(jsonStr) {
  if (jsonStr === null || jsonStr === undefined) {
    return null;
  }
  
  if (typeof jsonStr !== 'string') {
    return jsonStr;
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // If it's not valid JSON, return as is (might be a SQL expression)
    return jsonStr;
  }
}

/**
 * Simple function to parse SQL values string
 */
function parseSimpleSqlValues(valuesStr) {
  const values = [];
  let currentVal = '';
  let inQuotes = false;
  let quoteChar = null;
  let i = 0;
  
  while (i < valuesStr.length) {
    const char = valuesStr[i];
    
    if (char === '\'' || char === '"') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && valuesStr[i - 1] !== '\\') {
        inQuotes = false;
        quoteChar = null;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(cleanValue(currentVal.trim()));
      currentVal = '';
      i++;
      continue;
    }
    
    currentVal += char;
    i++;
  }
  
  // Add the last value
  if (currentVal.trim()) {
    values.push(cleanValue(currentVal.trim()));
  }
  
  return values;
}

/**
 * Clean up a parsed value
 */
function cleanValue(value) {
  if (typeof value !== 'string') return value;
  
  value = value.trim();
  
  // Handle NULL
  if (value.toUpperCase() === 'NULL') {
    return null;
  }
  
  // Handle quoted strings
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.substring(1, value.length - 1);
  }
  
  // Try to convert to number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }
  
  return value;
}

// Run the function
copyPricingFromBackup()
  .then(() => console.log('\n🎉 Pricing copying completed!'))
  .catch(error => console.error('❌ Error during pricing copying:', error));