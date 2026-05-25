require('dotenv').config(); // Load environment variables

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Duplicate services with modified pricing
 */
async function duplicateServicesWithModifiedPricing() {
  console.log("Fetching existing services and their pricing...");

  // Fetch all services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*');
  
  if (servicesError) {
    console.error('Error fetching services:', servicesError);
    return;
  }

  console.log(`Found ${services.length} services to duplicate`);

  for (const service of services) {
    console.log(`Duplicating service: ${service.name}`);

    // Create a copy of the service with a modified name to indicate it's a duplicate
    const duplicatedService = {
      ...service,
      id: undefined, // Let Supabase auto-generate a new ID
      name: `${service.name} (Duplicate - Review Price)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Remove the original ID to force creation of a new record
    delete duplicatedService.id;

    // Insert the duplicated service
    const { data: newService, error: insertError } = await supabase
      .from('services')
      .insert([duplicatedService])
      .select()
      .single();

    if (insertError) {
      console.error(`Error duplicating service ${service.name}:`, insertError);
      continue;
    }

    console.log(`Duplicated service: ${newService.name} with ID: ${newService.id}`);

    // Now duplicate the pricing records for this new service
    await duplicatePricingForService(service.id, newService.id, service.name);
  }

  console.log("Service duplication completed!");
}

/**
 * Duplicate pricing records for a specific service
 */
async function duplicatePricingForService(originalServiceId, newServiceId, serviceName) {
  console.log(`Duplicating pricing for service: ${serviceName}`);

  // Fetch all pricing records for the original service
  const { data: pricingRecords, error: pricingError } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('service_id', originalServiceId);

  if (pricingError) {
    console.error(`Error fetching pricing for service ${originalServiceId}:`, pricingError);
    return;
  }

  console.log(`Found ${pricingRecords.length} pricing records for ${serviceName}`);

  // Prepare new pricing records with the new service ID
  const newPricingRecords = pricingRecords.map(record => ({
    ...record,
    id: undefined, // Let Supabase auto-generate a new ID
    service_id: newServiceId, // Point to the new service
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  if (newPricingRecords.length > 0) {
    // Insert all the new pricing records
    const { error: insertPricingError } = await supabase
      .from('service_pricing')
      .insert(newPricingRecords);

    if (insertPricingError) {
      console.error(`Error duplicating pricing for service ${serviceName}:`, insertPricingError);
    } else {
      console.log(`Duplicated ${newPricingRecords.length} pricing records for ${newServiceId}`);
    }
  }
}

// Run the duplication process
duplicateServicesWithModifiedPricing()
  .then(() => console.log('Service duplication process completed'))
  .catch(error => console.error('Error during duplication process:', error));