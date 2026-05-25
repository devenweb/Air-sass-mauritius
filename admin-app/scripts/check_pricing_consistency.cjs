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
 * Checks if existing service prices match the pricing manager's grid
 */
async function checkPricingConsistency() {
  console.log("Checking if existing service prices match the pricing manager's grid...\n");
  
  try {
    // Load the backup data from the specific directory (this represents the pricing manager's grid)
    const backupDir = path.join(__dirname, '..', 'supabase', 'backups', '2026-05-03T19-29', 'data');
    
    // Load pricing data (this represents the pricing manager's grid)
    const pricingPath = path.join(backupDir, 'service_pricing.json');
    const pricingGridData = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));
    
    // Load services data to map IDs to names
    const servicesPath = path.join(backupDir, 'services.json');
    const servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
    
    // Get existing services from the database
    const { data: existingServices, error: servicesError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesError) {
      console.log(`❌ Error fetching existing services:`, servicesError.message);
      return;
    }
    
    console.log(`📊 Found ${existingServices.length} existing services in the database`);
    console.log(`📊 Found ${pricingGridData.length} pricing records in the pricing manager's grid`);
    
    // Map service IDs to names for easier identification
    const serviceNameMap = new Map();
    servicesData.forEach(service => {
      serviceNameMap.set(service.id, service.name);
    });
    
    // Check each existing service against the pricing grid
    for (const existingService of existingServices) {
      console.log(`\n🔍 Checking service: ${existingService.name} (ID: ${existingService.id})`);
      
      // Find pricing records in the grid for this service's original ID
      // Since we created services with variations, we need to match by name pattern
      let originalServiceId = null;
      
      // Try to find the original service ID by name match
      for (const service of servicesData) {
        if (existingService.name.includes(service.name.replace(/[^a-zA-Z0-9\s]/g, ''))) {
          originalServiceId = service.id;
          break;
        }
      }
      
      if (originalServiceId) {
        console.log(`   📍 Original service ID identified: ${originalServiceId} (${serviceNameMap.get(originalServiceId)})`);
        
        // Get the pricing records for this service from the pricing manager's grid
        const gridPricingRecords = pricingGridData.filter(pr => pr.service_id === originalServiceId);
        
        if (gridPricingRecords.length > 0) {
          // Get the existing pricing records for this service
          const { data: existingPricing, error: pricingError } = await supabase
            .from('service_pricing')
            .select('*')
            .eq('service_id', existingService.id);
          
          if (pricingError) {
            console.log(`     ❌ Error fetching existing pricing:`, pricingError.message);
            continue;
          }
          
          console.log(`     📊 Found ${existingPricing.length} existing pricing records for this service`);
          console.log(`     📊 Found ${gridPricingRecords.length} pricing records in the pricing manager's grid`);
          
          // Compare each existing pricing record with the grid
          for (const existingPrice of existingPricing) {
            let matched = false;
            
            for (const gridPrice of gridPricingRecords) {
              // Compare key pricing attributes
              if (
                existingPrice.label === gridPrice.label &&
                existingPrice.date_from === gridPrice.date_from &&
                existingPrice.date_to === gridPrice.date_to &&
                existingPrice.price === gridPrice.price &&
                existingPrice.price_child === gridPrice.price_child &&
                existingPrice.price_teen === gridPrice.price_teen &&
                existingPrice.price_infant === gridPrice.price_infant
              ) {
                matched = true;
                break;
              }
            }
            
            if (!matched) {
              console.log(`     ⚠️  Pricing mismatch found:`);
              console.log(`         Label: "${existingPrice.label}"`);
              console.log(`         Dates: ${existingPrice.date_from} to ${existingPrice.date_to}`);
              console.log(`         Price: ${existingPrice.price} (vs grid)`);
              console.log(`         Child Price: ${existingPrice.price_child} (vs grid)`);
            } else {
              console.log(`     ✅ Pricing for "${existingPrice.label}" matches the grid`);
            }
          }
        } else {
          console.log(`     ⚠️  No pricing records found in the grid for this service`);
        }
      } else {
        console.log(`     ❓ Could not identify original service ID for comparison`);
      }
    }
    
    console.log("\n✅ Finished checking pricing consistency with the pricing manager's grid!");
  } catch (error) {
    console.log(`❌ Error during pricing consistency check:`, error.message);
  }
}

// Run the function
checkPricingConsistency()
  .then(() => console.log('\n✨ Complete!'))
  .catch(error => console.error('❌ Error:', error));