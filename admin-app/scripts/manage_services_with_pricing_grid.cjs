require('dotenv').config(); // Load environment variables

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Using service role key for admin access
);

/**
 * Creates a new service with corresponding pricing grid entries
 */
async function createServiceWithPricingGrid(originalServiceId, pricingVariation = 0) {
  console.log(`Creating new service based on ID: ${originalServiceId} with ${pricingVariation*100}% pricing variation`);
  
  // Get the original service
  const { data: originalService, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', originalServiceId)
    .single();
  
  if (serviceError) {
    console.error(`Error fetching original service:`, serviceError);
    return null;
  }
  
  // Create a new service based on the original
  const newService = {
    ...originalService,
    id: undefined, // Let Supabase auto-generate
    name: `${originalService.name} (Pricing Variation ${pricingVariation*100}%)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  // Remove the original ID to force creation of a new record
  delete newService.id;
  
  // Insert the new service
  const { data: createdService, error: insertError } = await supabase
    .from('services')
    .insert([newService])
    .select()
    .single();
  
  if (insertError) {
    console.error(`Error creating new service:`, insertError);
    return null;
  }
  
  console.log(`Created new service: ${createdService.name} with ID: ${createdService.id}`);
  
  // Copy and modify pricing records for the new service
  await copyAndModifyPricingForNewService(originalServiceId, createdService.id, pricingVariation);
  
  return createdService;
}

/**
 * Copies and modifies pricing records for a new service
 */
async function copyAndModifyPricingForNewService(originalServiceId, newServiceId, pricingVariation) {
  console.log(`Copying pricing records from ${originalServiceId} to ${newServiceId} with ${pricingVariation*100}% variation`);
  
  // Get the original pricing records
  const { data: originalPricing, error: pricingError } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('service_id', originalServiceId);
  
  if (pricingError) {
    console.error(`Error fetching original pricing:`, pricingError);
    return;
  }
  
  // Create new pricing records for the new service with modified prices
  const newPricingRecords = originalPricing.map(record => {
    const modifiedRecord = { ...record };
    
    // Modify prices based on the variation
    if (typeof record.price === 'number') {
      modifiedRecord.price = Math.round(record.price * (1 + pricingVariation) * 100) / 100;
    }
    if (typeof record.price_child === 'number') {
      modifiedRecord.price_child = Math.round(record.price_child * (1 + pricingVariation) * 100) / 100;
    }
    if (typeof record.price_teen === 'number') {
      modifiedRecord.price_teen = Math.round(record.price_teen * (1 + pricingVariation) * 100) / 100;
    }
    if (typeof record.price_infant === 'number') {
      modifiedRecord.price_infant = Math.round(record.price_infant * (1 + pricingVariation) * 100) / 100;
    }
    
    // Update the record with new service ID and timestamps
    modifiedRecord.service_id = newServiceId;
    modifiedRecord.id = undefined; // Let Supabase auto-generate
    modifiedRecord.created_at = new Date().toISOString();
    modifiedRecord.updated_at = new Date().toISOString();
    
    return modifiedRecord;
  });
  
  if (newPricingRecords.length > 0) {
    // Insert the new pricing records
    const { error: insertPricingError } = await supabase
      .from('service_pricing')
      .insert(newPricingRecords);
    
    if (insertPricingError) {
      console.error(`Error inserting new pricing records:`, insertPricingError);
    } else {
      console.log(`Inserted ${newPricingRecords.length} new pricing records for service ${newServiceId}`);
    }
  }
}

/**
 * Main function to create multiple service variations with different pricing
 */
async function createServiceVariations() {
  console.log("Starting to create service variations with pricing grid...");
  
  // Get some sample services to create variations from
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name')
    .limit(5); // Limit to 5 services for this example
  
  if (servicesError) {
    console.error('Error fetching services:', servicesError);
    return;
  }
  
  console.log(`Found ${services.length} services to create variations from`);
  
  // Define pricing variations to create
  const pricingVariations = [0.1, -0.1, 0.15, -0.15]; // +10%, -10%, +15%, -15%
  
  for (const service of services) {
    for (const variation of pricingVariations) {
      await createServiceWithPricingGrid(service.id, variation);
    }
  }
  
  console.log("Finished creating service variations with pricing grid");
}

// Run the function
createServiceVariations()
  .then(() => console.log('Process completed'))
  .catch(error => console.error('Error during process:', error));