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
 * Processes backup files by extracting a small sample and creating new services with different pricing
 */
async function processBackupFilesFinal() {
  console.log("Processing backup files (final approach) to create new services with different pricing...\n");
  
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
      
      // Extract just the first few service entries
      const serviceMatches = [...sqlContent.matchAll(/INSERT INTO public\.services [\s\S]*?VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT/g)];
      
      if (serviceMatches.length === 0) {
        console.log(`   ❌ No service entries found in ${seedFile}`);
        continue;
      }
      
      console.log(`   📊 Found ${serviceMatches.length} service entries in ${seedFile}`);
      
      // Process only the first 2 services to keep it simple
      for (let i = 0; i < Math.min(2, serviceMatches.length); i++) {
        const match = serviceMatches[i];
        const valuesStr = match[1];
        
        // Extract the service values
        const values = parseSimpleSqlValues(valuesStr);
        
        if (values.length >= 3) {
          const originalServiceId = values[0]; // original id from backup
          const serviceName = values[1]; // name
          const serviceDesc = values[2]; // description
          
          // Create a new service with modified name (without ID, so Supabase auto-generates it)
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
            
            console.log(`     ✅ Created service: ${insertedService.name} (ID: ${insertedService.id})`);
            
            // Find pricing records for the original service in the SQL and create variations
            const pricingRegex = new RegExp(`INSERT INTO public\\.service_pricing.*?VALUES\\s*\\(([^)]*?'${originalServiceId}'[^)]*)\\)\\s*ON CONFLICT`, 'g');
            const pricingMatches = [...sqlContent.matchAll(pricingRegex)];
            
            for (let j = 0; j < Math.min(3, pricingMatches.length); j++) { // Limit to 3 pricing records
              const pMatch = pricingMatches[j];
              const pValuesStr = pMatch[1];
              const pValues = parseSimpleSqlValues(pValuesStr);
              
              if (pValues.length >= 7) {
                const priceVariations = [
                  { variation: 0.05, labelSuffix: " (+5%)" }, // 5% increase
                  { variation: -0.05, labelSuffix: " (-5%)" }, // 5% decrease
                  { variation: 0.1, labelSuffix: " (+10%)" }, // 10% increase
                  { variation: -0.1, labelSuffix: " (-10%)" }  // 10% decrease
                ];
                
                for (const { variation, labelSuffix } of priceVariations) {
                  // Create new pricing record based on the original with adjusted prices
                  const newPricing = {
                    service_id: insertedService.id, // Link to the NEW service (not the original)
                    variant_id: pValues[2] || null,
                    label: `${pValues[3] || 'Default'}${labelSuffix}`,
                    date_from: pValues[4],
                    date_to: pValues[5],
                    price: pValues[6] && typeof pValues[6] === 'number' ? 
                          Math.round(pValues[6] * (1 + variation) * 100) / 100 : 
                          (pValues[6] && !isNaN(parseFloat(pValues[6])) ? 
                           Math.round(parseFloat(pValues[6]) * (1 + variation) * 100) / 100 : 0),
                    price_child: pValues[11] && typeof pValues[11] === 'number' ? 
                                Math.round(pValues[11] * (1 + variation) * 100) / 100 : 
                                (pValues[11] && !isNaN(parseFloat(pValues[11])) ? 
                                 Math.round(parseFloat(pValues[11]) * (1 + variation) * 100) / 100 : 0),
                    price_teen: pValues[12] && typeof pValues[12] === 'number' ? 
                               Math.round(pValues[12] * (1 + variation) * 100) / 100 : 
                               (pValues[12] && !isNaN(parseFloat(pValues[12])) ? 
                                Math.round(parseFloat(pValues[12]) * (1 + variation) * 100) / 100 : 0),
                    price_infant: pValues[10] && typeof pValues[10] === 'number' ? 
                                 Math.round(pValues[10] * (1 + variation) * 100) / 100 : 
                                 (pValues[10] && !isNaN(parseFloat(pValues[10])) ? 
                                  Math.round(parseFloat(pValues[10]) * (1 + variation) * 100) / 100 : 0),
                    currency: pValues[7] || 'Rs',
                    price_type: pValues[8] || 'per_person',
                    notes: pValues[9] || null,
                    units_available: pValues[15] || null,
                    is_stop_sell: pValues[16] === 'true',
                    // Handle JSON fields safely - parse if valid JSON, otherwise use as-is
                    occupancy_pricing: safeParseJson(pValues[17]),
                    meal_plan_id: pValues[18] || null,
                    service_fee: pValues[19] || null,
                    net_price: pValues[20] && typeof pValues[20] === 'number' ? 
                              Math.round(pValues[20] * (1 + variation) * 100) / 100 : 
                              (pValues[20] && !isNaN(parseFloat(pValues[20])) ? 
                               Math.round(parseFloat(pValues[20]) * (1 + variation) * 100) / 100 : 0),
                    net_price_teen: pValues[21] && typeof pValues[21] === 'number' ? 
                                   Math.round(pValues[21] * (1 + variation) * 100) / 100 : 
                                   (pValues[21] && !isNaN(parseFloat(pValues[21])) ? 
                                    Math.round(parseFloat(pValues[21]) * (1 + variation) * 100) / 100 : 0),
                    net_price_child: pValues[22] && typeof pValues[22] === 'number' ? 
                                    Math.round(pValues[22] * (1 + variation) * 100) / 100 : 
                                    (pValues[22] && !isNaN(parseFloat(pValues[22])) ? 
                                     Math.round(parseFloat(pValues[22]) * (1 + variation) * 100) / 100 : 0),
                    net_price_infant: pValues[23] && typeof pValues[23] === 'number' ? 
                                     Math.round(pValues[23] * (1 + variation) * 100) / 100 : 
                                     (pValues[23] && !isNaN(parseFloat(pValues[23])) ? 
                                      Math.round(parseFloat(pValues[23]) * (1 + variation) * 100) / 100 : 0),
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
                      console.log(`       ❌ Error inserting pricing for service ${insertedService.id}:`, insertPricingError.message);
                    } else {
                      console.log(`       ✅ Created pricing: ${insertedPricing.label} with price: ${insertedPricing.price}`);
                    }
                  } catch (pricingErr) {
                    console.log(`       ❌ Error creating pricing for service ${insertedService.id}:`, pricingErr.message);
                  }
                }
              }
            }
          } catch (err) {
            console.log(`     ❌ Error creating service from backup ${backupDir}:`, err.message);
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
processBackupFilesFinal()
  .then(() => console.log('\n🎉 Backup processing completed!'))
  .catch(error => console.error('❌ Error during backup processing:', error));