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
 * Appends services with different pricing than existing ones
 */
async function appendDifferentPricedServices() {
  console.log("Appending services with different pricing than existing ones...\n");
  
  try {
    // Load the backup data from the specific directory
    const backupDir = path.join(__dirname, '..', 'supabase', 'backups', '2026-05-03T19-29', 'data');
    
    // Load services data
    const servicesPath = path.join(backupDir, 'services.json');
    const servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
    
    // Load pricing data
    const pricingPath = path.join(backupDir, 'service_pricing.json');
    const pricingData = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));
    
    console.log(`📊 Found ${servicesData.length} services and ${pricingData.length} pricing records in backup`);
    
    // Process services (limit to first 5 to prevent overload)
    for (let i = 0; i < Math.min(5, servicesData.length); i++) {
      const service = servicesData[i];
      
      // Create a new service with different pricing (same name but different pricing)
      const newService = {
        name: `${service.name} (Different Pricing)`,
        description: service.description ? `${service.description} (With different pricing variants)` : '(With different pricing variants)',
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
          console.log(`     ❌ Error creating service:`, insertServiceError.message);
          continue;
        }
        
        console.log(`     ✅ Created service: ${insertedService.name} (ID: ${insertedService.id})`);
        
        // Now find pricing records for this service in the backup data and apply variations
        const servicePricing = pricingData.filter(pr => pr.service_id === service.id);
        
        // Apply different pricing variations to the new service
        for (const pricing of servicePricing.slice(0, 3)) { // Limit to first 3 pricing records per service
          const priceVariations = [
            { variation: 0.1, labelSuffix: " (+10%)" },  // 10% increase
            { variation: -0.1, labelSuffix: " (-10%)" }, // 10% decrease
            { variation: 0.2, labelSuffix: " (+20%)" },  // 20% increase
            { variation: -0.2, labelSuffix: " (-20%)" }  // 20% decrease
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
        console.log(`     ❌ Error creating service:`, err.message);
      }
    }
    
    console.log("\n✅ Finished appending services with different pricing!");
  } catch (error) {
    console.log(`❌ Error during appending services with different pricing:`, error.message);
  }
}

// Run the function
appendDifferentPricedServices()
  .then(() => console.log('\n✨ Complete!'))
  .catch(error => console.error('❌ Error:', error));