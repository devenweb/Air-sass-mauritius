require('dotenv').config(); // Load environment variables

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with anon key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Updates existing pricing records to ensure they properly connect services to the pricing grid
 */
async function updatePricingGridConnections() {
  console.log("Updating pricing grid connections for existing services...");
  
  // Fetch all services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*');
  
  if (servicesError) {
    console.error('Error fetching services:', servicesError);
    return;
  }
  
  console.log(`Found ${services.length} services to process`);
  
  // For each service, make sure it has proper pricing grid entries
  for (const service of services) {
    console.log(`Processing service: ${service.name}`);
    
    // Fetch existing pricing records for this service
    const { data: pricingRecords, error: pricingError } = await supabase
      .from('service_pricing')
      .select('*')
      .eq('service_id', service.id);
    
    if (pricingError) {
      console.error(`Error fetching pricing for service ${service.id}:`, pricingError);
      continue;
    }
    
    console.log(`  Found ${pricingRecords.length} pricing records for ${service.name}`);
    
    // For each pricing record, potentially create variations to populate the pricing grid
    for (let i = 0; i < pricingRecords.length; i++) {
      const originalPricing = pricingRecords[i];
      
      // Create pricing variations to enrich the pricing grid
      const variations = [
        { variation: 0.1, labelSuffix: " (+10%)" },
        { variation: -0.1, labelSuffix: " (-10%)" },
        { variation: 0.15, labelSuffix: " (+15%)" },
        { variation: -0.15, labelSuffix: " (-15%)" }
      ];
      
      for (const { variation, labelSuffix } of variations) {
        // Create a new pricing record with a modified price
        const newPricing = {
          ...originalPricing,
          id: undefined, // Let Supabase auto-generate
          price: typeof originalPricing.price === 'number' 
                 ? Math.round(originalPricing.price * (1 + variation) * 100) / 100 
                 : originalPricing.price,
          price_child: typeof originalPricing.price_child === 'number' 
                       ? Math.round(originalPricing.price_child * (1 + variation) * 100) / 100 
                       : originalPricing.price_child,
          price_teen: typeof originalPricing.price_teen === 'number' 
                      ? Math.round(originalPricing.price_teen * (1 + variation) * 100) / 100 
                      : originalPricing.price_teen,
          price_infant: typeof originalPricing.price_infant === 'number' 
                        ? Math.round(originalPricing.price_infant * (1 + variation) * 100) / 100 
                        : originalPricing.price_infant,
          label: `${originalPricing.label || 'Default'}${labelSuffix}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Remove the ID to force creation of a new record
        delete newPricing.id;
        
        try {
          // Attempt to insert the new pricing record
          const { data: insertedPricing, error: insertError } = await supabase
            .from('service_pricing')
            .insert([newPricing])
            .select()
            .single();
          
          if (insertError) {
            console.log(`    Could not insert pricing variation for service ${service.id}:`, insertError.message);
          } else {
            console.log(`    Created pricing variation: ${insertedPricing.label} with price: ${insertedPricing.price}`);
          }
        } catch (err) {
          // If insertion fails due to RLS, log and continue
          console.log(`    Skipping pricing variation for service ${service.id} due to permissions:`, err.message);
        }
      }
    }
  }
  
  console.log("Completed processing pricing grid connections");
}

// Run the function
updatePricingGridConnections()
  .then(() => console.log('Pricing grid update process completed'))
  .catch(error => console.error('Error during pricing grid update:', error));