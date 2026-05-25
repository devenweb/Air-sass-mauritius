require('dotenv').config(); // Load environment variables

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Appends new services with different pricing to the database
 */
async function appendServicesWithPricing() {
  console.log("Appending new services with different pricing to the database...");
  
  // Get existing services to use as templates for new services
  const { data: existingServices, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .limit(5); // Limit to 5 services to use as templates
  
  if (servicesError) {
    console.error('Error fetching existing services:', servicesError);
    return;
  }
  
  console.log(`Found ${existingServices.length} existing services to use as templates`);
  
  for (const templateService of existingServices) {
    console.log(`Creating new service based on: ${templateService.name}`);
    
    // Create a new service with modified name to indicate it's a pricing variant
    const newService = {
      ...templateService,
      id: undefined, // Let Supabase auto-generate
      name: `${templateService.name} - Price Variant`,
      description: `${templateService.description || ''} (Variant with different pricing)`,
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
        console.log(`    Error creating new service based on ${templateService.name}:`, insertServiceError.message);
        continue;
      }
      
      console.log(`    Created new service: ${insertedService.name} with ID: ${insertedService.id}`);
      
      // Now create pricing records for this new service based on the template service's pricing
      const { data: templatePricing, error: pricingError } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_id', templateService.id)
        .limit(5); // Limit to 5 pricing records per service
      
      if (pricingError) {
        console.log(`    Error fetching pricing for template service ${templateService.id}:`, pricingError.message);
        continue;
      }
      
      console.log(`    Found ${templatePricing.length} pricing records for the template service`);
      
      for (const pricing of templatePricing) {
        // Create pricing variations with different prices
        const priceVariations = [
          { variation: 0.1, labelSuffix: " (+10%)" }, // 10% increase
          { variation: -0.1, labelSuffix: " (-10%)" }, // 10% decrease
          { variation: 0.25, labelSuffix: " (+25%)" }, // 25% increase
          { variation: -0.25, labelSuffix: " (-25%)" }  // 25% decrease
        ];
        
        for (const { variation, labelSuffix } of priceVariations) {
          const newPricing = {
            service_id: insertedService.id, // Link to the new service
            variant_id: pricing.variant_id,
            label: `${pricing.label || 'Default'}${labelSuffix}`,
            date_from: pricing.date_from,
            date_to: pricing.date_to,
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
              console.log(`      Error inserting pricing for new service ${insertedService.id}:`, insertPricingError.message);
            } else {
              console.log(`      Created pricing: ${insertedPricing.label} with price: ${insertedPricing.price}`);
            }
          } catch (pricingErr) {
            console.log(`      Error creating pricing for new service ${insertedService.id}:`, pricingErr.message);
          }
        }
      }
    } catch (err) {
      console.log(`    Error creating new service based on ${templateService.name}:`, err.message);
    }
  }
  
  console.log("Completed appending new services with different pricing");
}

// Run the function
appendServicesWithPricing()
  .then(() => console.log('Service appending process completed'))
  .catch(error => console.error('Error during service appending:', error));