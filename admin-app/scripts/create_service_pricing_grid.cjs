require('dotenv').config(); // Load environment variables

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Using the correct service role key
);

/**
 * Creates pricing grid entries for services using the service role key
 */
async function createPricingGridEntries() {
  console.log("Creating pricing grid entries for services with service role key...");
  
  // Get some sample services to create pricing variations for
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name')
    .limit(5); // Limit to 5 services for this example
  
  if (servicesError) {
    console.error('Error fetching services:', servicesError);
    return;
  }
  
  console.log(`Found ${services.length} services to create pricing grid entries for`);
  
  for (const service of services) {
    console.log(`Processing service: ${service.name} (${service.id})`);
    
    // Get existing pricing records for this service
    const { data: pricingRecords, error: pricingError } = await supabase
      .from('service_pricing')
      .select('*')
      .eq('service_id', service.id)
      .limit(10); // Limit to 10 records to create variations from
    
    if (pricingError) {
      console.error(`Error fetching pricing for service ${service.id}:`, pricingError);
      continue;
    }
    
    console.log(`  Found ${pricingRecords.length} existing pricing records to create variations from`);
    
    // For each pricing record, create several variations to enrich the pricing grid
    for (const pricing of pricingRecords) {
      const variations = [
        { variation: 0.1, labelSuffix: " (+10%)" }, // 10% increase
        { variation: -0.1, labelSuffix: " (-10%)" }, // 10% decrease
        { variation: 0.2, labelSuffix: " (+20%)" }, // 20% increase
        { variation: -0.2, labelSuffix: " (-20%)" }  // 20% decrease
      ];
      
      for (const { variation, labelSuffix } of variations) {
        // Create a new pricing record with modified prices
        const newPricing = {
          service_id: service.id,
          variant_id: pricing.variant_id, // Keep the same variant_id
          price: typeof pricing.price === 'number' 
                 ? Math.round(pricing.price * (1 + variation) * 100) / 100 
                 : pricing.price,
          price_child: typeof pricing.price_child === 'number' 
                       ? Math.round(pricing.price_child * (1 + variation) * 100) / 100 
                       : pricing.price_child,
          price_teen: typeof pricing.price_teen === 'number' 
                      ? Math.round(pricing.price_teen * (1 + variation) * 100) / 100 
                      : pricing.price_teen,
          price_infant: typeof pricing.price_infant === 'number' 
                        ? Math.round(pricing.price_infant * (1 + variation) * 100) / 100 
                        : pricing.price_infant,
          date_from: pricing.date_from,
          date_to: pricing.date_to,
          currency: pricing.currency,
          price_type: pricing.price_type,
          notes: pricing.notes,
          units_available: pricing.units_available,
          is_stop_sell: pricing.is_stop_sell,
          occupancy_pricing: pricing.occupancy_pricing,
          meal_plan_id: pricing.meal_plan_id,
          service_fee: pricing.service_fee,
          net_price: typeof pricing.net_price === 'number'
                     ? Math.round(pricing.net_price * (1 + variation) * 100) / 100
                     : pricing.net_price,
          net_price_teen: typeof pricing.net_price_teen === 'number'
                          ? Math.round(pricing.net_price_teen * (1 + variation) * 100) / 100
                          : pricing.net_price_teen,
          net_price_child: typeof pricing.net_price_child === 'number'
                           ? Math.round(pricing.net_price_child * (1 + variation) * 100) / 100
                           : pricing.net_price_child,
          net_price_infant: typeof pricing.net_price_infant === 'number'
                            ? Math.round(pricing.net_price_infant * (1 + variation) * 100) / 100
                            : pricing.net_price_infant,
          net_occupancy_pricing: pricing.net_occupancy_pricing,
          label: `${pricing.label || 'Standard'}${labelSuffix}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        try {
          // Insert the new pricing record using the service role key (should bypass RLS)
          const { data: insertedPricing, error: insertError } = await supabase
            .from('service_pricing')
            .insert([newPricing])
            .select()
            .single();
          
          if (insertError) {
            console.log(`    Error inserting pricing variation for service ${service.id}:`, insertError.message);
          } else {
            console.log(`    Created pricing variation: ${insertedPricing.label} with price: ${insertedPricing.price}`);
          }
        } catch (err) {
          console.log(`    Error creating pricing variation for service ${service.id}:`, err.message);
        }
      }
    }
  }
  
  console.log("Completed creating pricing grid entries for services");
}

// Run the function
createPricingGridEntries()
  .then(() => console.log('Pricing grid creation process completed'))
  .catch(error => console.error('Error during pricing grid creation:', error));