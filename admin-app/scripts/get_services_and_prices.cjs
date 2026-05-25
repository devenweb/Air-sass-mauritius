require('dotenv').config(); // Load environment variables
const fs = require('fs');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fetches and displays services with their pricing information
 */
async function getServicesAndPrices() {
  console.log("Fetching services and their pricing information...\n");
  
  try {
    // Get all services from the database
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesError) {
      console.log(`❌ Error fetching services:`, servicesError.message);
      return;
    }
    
    console.log(`📊 Found ${services.length} services in the database\n`);
    
    // Get all pricing records
    const { data: pricingRecords, error: pricingError } = await supabase
      .from('service_pricing')
      .select(`
        *,
        services(name)
      `)
      .order('service_id');
    
    if (pricingError) {
      console.log(`❌ Error fetching pricing records:`, pricingError.message);
      return;
    }
    
    console.log(`📊 Found ${pricingRecords.length} pricing records in the database\n`);
    
    // Group pricing by service
    const pricingByService = {};
    pricingRecords.forEach(pricing => {
      if (!pricingByService[pricing.service_id]) {
        pricingByService[pricing.service_id] = [];
      }
      pricingByService[pricing.service_id].push(pricing);
    });
    
    // Display services with their pricing
    for (const service of services) {
      console.log(`\n======= SERVICE =======`);
      console.log(`ID: ${service.id}`);
      console.log(`Name: ${service.name}`);
      console.log(`Created: ${service.created_at}`);
      
      const servicePricing = pricingByService[service.id] || [];
      
      if (servicePricing.length > 0) {
        console.log(`Pricing Records (${servicePricing.length}):`);
        servicePricing.forEach((pricing, index) => {
          console.log(`  #${index + 1}:`);
          console.log(`    Label: ${pricing.label}`);
          console.log(`    Dates: ${pricing.date_from} to ${pricing.date_to}`);
          console.log(`    Price: ${pricing.price} ${pricing.currency} (${pricing.price_type})`);
          console.log(`    Child Price: ${pricing.price_child}`);
          console.log(`    Teen Price: ${pricing.price_teen}`);
          console.log(`    Infant Price: ${pricing.price_infant}`);
          console.log(`    Net Price: ${pricing.net_price}`);
          console.log(`    Capacity: ${pricing.capacity}`);
          console.log(`    Duration: ${pricing.duration} ${pricing.duration_type || ''}`);
          console.log(`    Units Available: ${pricing.units_available}`);
          console.log(`    Stop Sell: ${pricing.is_stop_sell}`);
        });
      } else {
        console.log(`No pricing records found for this service.`);
      }
      
      console.log(`=====================\n`);
    }
    
    console.log(`\n✅ Completed fetching services and pricing information!`);
    
    // Summary statistics
    console.log(`\n📈 SUMMARY STATISTICS:`);
    console.log(`   Total services: ${services.length}`);
    console.log(`   Total pricing records: ${pricingRecords.length}`);
    console.log(`   Average pricing records per service: ${(pricingRecords.length / services.length).toFixed(2)}`);
    
    // Identify services with no pricing
    const servicesWithoutPricing = services.filter(service => 
      !pricingByService[service.id] || pricingByService[service.id].length === 0
    );
    console.log(`   Services without pricing: ${servicesWithoutPricing.length}`);
    
    // Identify services with multiple pricing records
    const servicesWithMultiplePricing = Object.values(pricingByService)
      .filter(pricingList => pricingList.length > 1)
      .length;
    console.log(`   Services with multiple pricing: ${servicesWithMultiplePricing}`);
    
  } catch (error) {
    console.log(`❌ Error during fetching services and pricing:`, error.message);
  }
}

// Run the function
getServicesAndPrices()
  .then(() => console.log('\n✨ Complete!'))
  .catch(error => console.error('❌ Error:', error));