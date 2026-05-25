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
 * Copies data from JSON backup file to the database
 */
async function copyFromJsonBackup() {
  console.log("Copying data from JSON backup file...\n");
  
  const jsonBackupPath = path.join(__dirname, '..', 'supabase', 'backups', 'TL_FULL_BACKUP_2026-05-18T08-17-19-209Z.json');
  
  console.log(`📦 Processing JSON backup: ${jsonBackupPath}`);
  
  try {
    // Read the JSON file
    const fullJsonData = JSON.parse(fs.readFileSync(jsonBackupPath, 'utf8'));
    const jsonData = fullJsonData.data; // Extract the data object
    
    console.log(`   📊 Loaded JSON backup with ${Object.keys(jsonData).length} tables`);
    
    // Process services first
    const servicesData = jsonData['services'];
    const pricingData = jsonData['service_pricing'];
    
    if (!servicesData) {
      console.log(`   ❌ No services data found in JSON backup`);
      return;
    }
    
    console.log(`   📊 Found ${servicesData.length} services in JSON backup`);
    
    // Map to store old ID -> new ID mappings
    const serviceIdMap = new Map();
    
    // Process services
    for (let i = 0; i < Math.min(5, servicesData.length); i++) { // Limit to first 5 services
      const service = servicesData[i];
      
      // Create a new service based on the backup data
      const newService = {
        name: `${service.name} (From JSON Backup)`,
        description: service.description ? `${service.description} (Imported from JSON backup)` : '(Imported from JSON backup)',
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
          console.log(`     ❌ Error creating service from JSON backup:`, insertServiceError.message);
          continue;
        }
        
        // Map the original service ID to the new service ID
        serviceIdMap.set(service.id, insertedService.id);
        
        console.log(`     ✅ Created service: ${insertedService.name} (New ID: ${insertedService.id}, Original ID: ${service.id})`);
      } catch (err) {
        console.log(`     ❌ Error creating service from JSON backup:`, err.message);
      }
    }
    
    if (!pricingData) {
      console.log(`   ❌ No pricing data found in JSON backup`);
      return;
    }
    
    console.log(`   📊 Found ${pricingData.length} pricing records in JSON backup`);
    
    // Process pricing records that match the services we created
    let copiedPricingCount = 0;
    for (let j = 0; j < Math.min(20, pricingData.length); j++) { // Limit to first 20 pricing records
      const pricing = pricingData[j];
      
      // Check if we have a mapping for this service ID
      if (serviceIdMap.has(pricing.service_id)) {
        const newServiceId = serviceIdMap.get(pricing.service_id);
        
        // Create new pricing record with the new service ID and original pricing data
        const newPricing = {
          service_id: newServiceId, // Use the NEW service ID
          variant_id: pricing.variant_id || null,
          label: pricing.label || 'Default',
          date_from: pricing.date_from,
          date_to: pricing.date_to,
          price: pricing.price || 0,
          price_child: pricing.price_child || 0,
          price_teen: pricing.price_teen || 0,
          price_infant: pricing.price_infant || 0,
          currency: pricing.currency || 'Rs',
          price_type: pricing.price_type || 'per_person',
          notes: pricing.notes || null,
          units_available: pricing.units_available || null,
          is_stop_sell: pricing.is_stop_sell || false,
          // Handle JSON fields safely
          occupancy_pricing: pricing.occupancy_pricing || null,
          meal_plan_id: pricing.meal_plan_id || null,
          service_fee: pricing.service_fee || null,
          net_price: pricing.net_price || 0,
          net_price_teen: pricing.net_price_teen || 0,
          net_price_child: pricing.net_price_child || 0,
          net_price_infant: pricing.net_price_infant || 0,
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
        console.log(`       ⚠️  Skipping pricing record for unmapped service ID: ${pricing.service_id}`);
      }
    }
    
    console.log(`\n✅ Completed processing JSON backup!`);
    console.log(`   Services created: ${serviceIdMap.size}`);
    console.log(`   Pricing records copied: ${copiedPricingCount}`);
  } catch (error) {
    console.log(`❌ Error processing JSON backup file:`, error.message);
  }
}

// Run the function
copyFromJsonBackup()
  .then(() => console.log('\n🎉 JSON backup processing completed!'))
  .catch(error => console.error('❌ Error during JSON backup processing:', error));