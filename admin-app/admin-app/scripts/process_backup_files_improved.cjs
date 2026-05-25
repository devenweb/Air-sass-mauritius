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
 * Processes each backup file and creates new services with different pricing
 */
async function processBackupFiles() {
  console.log("Processing backup files to create new services with different pricing...\n");
  
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
      // Read and parse the seed file
      const sqlContent = fs.readFileSync(seedFilePath, 'utf8');
      
      // Extract service and pricing data from the SQL using a more robust approach
      const services = extractServicesFromSql(sqlContent);
      const pricingRecords = extractPricingFromSql(sqlContent);
      
      console.log(`   📊 Found ${services.length} services and ${pricingRecords.length} pricing records`);
      
      // Create new services with different pricing based on the backup data
      for (const service of services.slice(0, 3)) { // Limit to first 3 services to avoid overloading
        // Create a new service with modified name to indicate it's from backup
        const newService = {
          ...service,
          id: undefined, // Let Supabase auto-generate
          name: `${service.name} (From Backup: ${backupDir})`,
          description: service.description ? `${service.description} (Imported from backup: ${backupDir})` : `(Imported from backup: ${backupDir})`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Remove the ID to force creation of a new record
        delete newService.id;
        
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
          
          // Find pricing records associated with this service from the backup data
          const servicePricing = pricingRecords.filter(pr => pr.service_id === service.id).slice(0, 5); // Limit to first 5 pricing records
          
          // Create pricing variations for this new service
          for (const pricing of servicePricing) {
            const priceVariations = [
              { variation: 0.05, labelSuffix: " (+5%)" }, // 5% increase
              { variation: -0.05, labelSuffix: " (-5%)" }, // 5% decrease
              { variation: 0.1, labelSuffix: " (+10%)" }, // 10% increase
              { variation: -0.1, labelSuffix: " (-10%)" }  // 10% decrease
            ];
            
            for (const { variation, labelSuffix } of priceVariations) {
              const newPricing = {
                service_id: insertedService.id, // Link to the new service
                variant_id: pricing.variant_id || null,
                label: `${pricing.label || 'Default'}${labelSuffix}`,
                date_from: pricing.date_from,
                date_to: pricing.date_to,
                price: typeof pricing.price === 'number' 
                       ? Math.round(pricing.price * (1 + variation) * 100) / 100 
                       : pricing.price || 0,
                price_child: typeof pricing.price_child === 'number' 
                             ? Math.round(pricing.price_child * (1 + variation) * 100) / 100 
                             : pricing.price_child || 0,
                price_teen: typeof pricing.price_teen === 'number' 
                            ? Math.round(pricing.price_teen * (1 + variation) * 100) / 100 
                            : pricing.price_teen || 0,
                price_infant: typeof pricing.price_infant === 'number' 
                              ? Math.round(pricing.price_infant * (1 + variation) * 100) / 100 
                              : pricing.price_infant || 0,
                currency: pricing.currency || 'Rs',
                price_type: pricing.price_type || 'per_person',
                notes: pricing.notes || null,
                units_available: pricing.units_available || null,
                is_stop_sell: pricing.is_stop_sell || false,
                occupancy_pricing: pricing.occupancy_pricing || null,
                meal_plan_id: pricing.meal_plan_id || null,
                service_fee: pricing.service_fee || null,
                net_price: typeof pricing.net_price === 'number'
                           ? Math.round(pricing.net_price * (1 + variation) * 100) / 100
                           : pricing.net_price || 0,
                net_price_teen: typeof pricing.net_price_teen === 'number'
                                ? Math.round(pricing.net_price_teen * (1 + variation) * 100) / 100
                                : pricing.net_price_teen || 0,
                net_price_child: typeof pricing.net_price_child === 'number'
                                 ? Math.round(pricing.net_price_child * (1 + variation) * 100) / 100
                                 : pricing.net_price_child || 0,
                net_price_infant: typeof pricing.net_price_infant === 'number'
                                  ? Math.round(pricing.net_price_infant * (1 + variation) * 100) / 100
                                  : pricing.net_price_infant || 0,
                net_occupancy_pricing: pricing.net_occupancy_pricing || null,
                // Include the newly added columns
                capacity: pricing.capacity || 0,
                duration: pricing.duration || null,
                duration_type: pricing.duration_type || null,
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
        } catch (err) {
          console.log(`     ❌ Error creating service from backup ${backupDir}:`, err.message);
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
 * Extracts service data from SQL content
 */
function extractServicesFromSql(sqlContent) {
  // Find the services table section in the SQL
  const servicesSectionStart = sqlContent.indexOf('-- Table: public.services');
  if (servicesSectionStart === -1) return [];
  
  const servicesSectionEnd = sqlContent.indexOf('-- Table: ', servicesSectionStart + 1);
  const servicesSection = sqlContent.substring(
    servicesSectionStart,
    servicesSectionEnd !== -1 ? servicesSectionEnd : sqlContent.length
  );
  
  // Extract INSERT statements for services
  const serviceInserts = servicesSection.match(/INSERT INTO public\.services [\s\S]*?;/g) || [];
  
  const services = [];
  
  serviceInserts.forEach(insertStatement => {
    // Match the VALUES clause and extract the data
    const valuesRegex = /VALUES\s*\(\s*((?:[^,()]|\([^)]*\))*(?:,\s*(?:[^,()]|\([^)]*\))*)*)\s*\)\s*ON CONFLICT/gi;
    const valuesMatches = [...insertStatement.matchAll(valuesRegex)];
    
    for (const match of valuesMatches) {
      const valuesStr = match[1];
      const values = parseSqlValues(valuesStr);
      
      // Extract column names from the INSERT statement
      const columnMatch = insertStatement.match(/INSERT INTO public\.services \((.*?)\)/);
      if (!columnMatch) continue;
      
      const columns = columnMatch[1].replace(/"/g, '').split(', ');
      
      if (values.length !== columns.length) {
        console.warn(`Column/value mismatch: ${columns.length} columns, ${values.length} values`);
        continue;
      }
      
      const service = {};
      columns.forEach((col, idx) => {
        service[col] = values[idx];
      });
      
      services.push(service);
    }
  });
  
  return services;
}

/**
 * Extracts pricing data from SQL content
 */
function extractPricingFromSql(sqlContent) {
  // Find the service_pricing table section in the SQL
  const pricingSectionStart = sqlContent.indexOf('-- Table: public.service_pricing');
  if (pricingSectionStart === -1) return [];
  
  const pricingSectionEnd = sqlContent.indexOf('-- Table: ', pricingSectionStart + 1);
  const pricingSection = sqlContent.substring(
    pricingSectionStart,
    pricingSectionEnd !== -1 ? pricingSectionEnd : sqlContent.length
  );
  
  // Extract INSERT statements for service_pricing
  const pricingInserts = pricingSection.match(/INSERT INTO public\.service_pricing [\s\S]*?;/g) || [];
  
  const pricingRecords = [];
  
  pricingInserts.forEach(insertStatement => {
    // Match the VALUES clause and extract the data
    const valuesRegex = /VALUES\s*\(\s*((?:[^,()]|\([^)]*\))*(?:,\s*(?:[^,()]|\([^)]*\))*)*)\s*\)\s*ON CONFLICT/gi;
    const valuesMatches = [...insertStatement.matchAll(valuesRegex)];
    
    for (const match of valuesMatches) {
      const valuesStr = match[1];
      const values = parseSqlValues(valuesStr);
      
      // Extract column names from the INSERT statement
      const columnMatch = insertStatement.match(/INSERT INTO public\.service_pricing \((.*?)\)/);
      if (!columnMatch) continue;
      
      const columns = columnMatch[1].replace(/"/g, '').split(', ');
      
      if (values.length !== columns.length) {
        console.warn(`Column/value mismatch: ${columns.length} columns, ${values.length} values`);
        continue;
      }
      
      const pricing = {};
      columns.forEach((col, idx) => {
        pricing[col] = values[idx];
      });
      
      pricingRecords.push(pricing);
    }
  });
  
  return pricingRecords;
}

/**
 * Robust function to parse SQL values string
 */
function parseSqlValues(valuesStr) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  let quoteChar = null;
  let parenthesisDepth = 0;
  let i = 0;
  
  while (i < valuesStr.length) {
    const char = valuesStr[i];
    
    // Handle entering/exiting quoted strings
    if (!inQuotes && !parenthesisDepth && (char === '\'' || char === '"')) {
      inQuotes = true;
      quoteChar = char;
    } 
    // Handle leaving quoted strings
    else if (inQuotes && char === quoteChar && valuesStr[i - 1] !== '\\') {
      inQuotes = false;
      quoteChar = null;
    } 
    // Handle parentheses (for JSON values)
    else if (!inQuotes && char === '(') {
      parenthesisDepth++;
    } 
    else if (!inQuotes && char === ')') {
      parenthesisDepth--;
    } 
    // Handle comma separation
    else if (!inQuotes && !parenthesisDepth && char === ',') {
      // Add the current value to the array
      values.push(cleanValue(currentValue));
      currentValue = '';
      i++; // Move to next character
      continue;
    }
    
    currentValue += char;
    i++;
  }
  
  // Add the last value
  if (currentValue.trim()) {
    values.push(cleanValue(currentValue));
  }
  
  return values;
}

/**
 * Clean up a parsed value
 */
function cleanValue(value) {
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
processBackupFiles()
  .then(() => console.log('\n🎉 Backup processing completed!'))
  .catch(error => console.error('❌ Error during backup processing:', error));