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
 * Recursively finds all SQL files in a directory and its subdirectories
 */
function findAllSqlFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = findAllSqlFiles(filePath, arrayOfFiles);
    } else if (path.extname(filePath) === '.sql') {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
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

/**
 * Copies data from SQL backup file to the database
 */
async function copyFromSqlBackup(sqlFilePath) {
  console.log(`📦 Processing SQL backup: ${sqlFilePath}`);
  
  try {
    // Read the SQL file content
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Extract service entries from the backup
    const serviceMatches = [...sqlContent.matchAll(/INSERT INTO public\.services [\s\S]*?VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT/g)];
    
    if (serviceMatches.length === 0) {
      console.log(`   ❌ No service entries found in ${path.basename(sqlFilePath)}`);
      return { success: false, error: "No service entries" };
    }
    
    console.log(`   📊 Found ${serviceMatches.length} service entries in ${path.basename(sqlFilePath)}`);
    
    // Map to store old ID -> new ID mappings
    const serviceIdMap = new Map();
    
    // Process services (limit to first 5 to prevent overload)
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
          name: `${serviceName} (From SQL Backup: ${path.basename(sqlFilePath)})`,
          description: serviceDesc ? `${serviceDesc} (Imported from SQL backup: ${path.basename(sqlFilePath)})` : `(Imported from SQL backup: ${path.basename(sqlFilePath)})`,
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
            console.log(`     ❌ Error creating service from SQL backup ${path.basename(sqlFilePath)}:`, insertServiceError.message);
            continue;
          }
          
          // Map the original service ID to the new service ID
          serviceIdMap.set(originalServiceId, insertedService.id);
          
          console.log(`     ✅ Created service: ${insertedService.name} (New ID: ${insertedService.id}, Original ID: ${originalServiceId})`);
        } catch (err) {
          console.log(`     ❌ Error creating service from SQL backup ${path.basename(sqlFilePath)}:`, err.message);
        }
      }
    }
    
    // Now process the pricing data
    const pricingMatches = [...sqlContent.matchAll(/INSERT INTO public\.service_pricing.*?VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT/g)];
    
    if (pricingMatches.length === 0) {
      console.log(`   ❌ No pricing entries found in ${path.basename(sqlFilePath)}`);
    } else {
      console.log(`   📊 Found ${pricingMatches.length} pricing entries in ${path.basename(sqlFilePath)}`);
      
      // Process only the first few pricing records to keep it manageable
      let copiedPricingCount = 0;
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
                copiedPricingCount++;
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
      
      console.log(`\n✅ Completed processing ${path.basename(sqlFilePath)}!`);
      console.log(`   Services created: ${serviceIdMap.size}`);
      console.log(`   Pricing records copied: ${copiedPricingCount}`);
      
      return { success: true, servicesCreated: serviceIdMap.size, pricingCopied: copiedPricingCount };
    }
  } catch (error) {
    console.log(`❌ Error processing SQL backup file:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to find and process all SQL backup files
 */
async function processAllSqlBackups() {
  console.log("Finding and processing all SQL backup files...\n");
  
  const backupBaseDir = path.join(__dirname, '..', 'supabase', 'backups');
  const sqlFiles = findAllSqlFiles(backupBaseDir);
  
  console.log(`📁 Found ${sqlFiles.length} SQL backup files\n`);
  
  const results = [];
  
  for (const sqlFile of sqlFiles) {
    console.log(`\n--- Processing file: ${path.basename(sqlFile)} ---`);
    const result = await copyFromSqlBackup(sqlFile);
    results.push({ file: path.basename(sqlFile), ...result });
  }
  
  // Print summary
  console.log("\n📋 PROCESSING SUMMARY:");
  console.log("======================");
  results.forEach(result => {
    console.log(`File: ${result.file}`);
    if (result.success) {
      console.log(`  Status: Success`);
      console.log(`  Services created: ${result.servicesCreated}`);
      console.log(`  Pricing records copied: ${result.pricingCopied}`);
    } else {
      console.log(`  Status: Failed`);
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  });
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📈 Total: ${results.length} files processed`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  console.log("\n🎉 All SQL backup files processed!");
}

// Run the function
processAllSqlBackups()
  .then(() => console.log('\n✨ Complete!'))
  .catch(error => console.error('❌ Error during SQL backup processing:', error));