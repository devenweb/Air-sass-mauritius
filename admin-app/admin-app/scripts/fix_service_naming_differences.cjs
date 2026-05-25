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
 * Fixes naming differences between services in the database and the pricing manager's grid
 */
async function fixServiceNamingDifferences() {
  console.log("Fixing naming differences between services and the pricing manager's grid...\n");
  
  try {
    // Load the backup data from the specific directory (this represents the pricing manager's grid)
    const backupDir = path.join(__dirname, '..', 'supabase', 'backups', '2026-05-03T19-29', 'data');
    
    // Load services data (this represents the original service names in the pricing manager's grid)
    const servicesPath = path.join(backupDir, 'services.json');
    const servicesData = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
    
    // Load pricing data to understand the relationships
    const pricingPath = path.join(backupDir, 'service_pricing.json');
    const pricingGridData = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));
    
    // Get existing services from the database
    const { data: existingServices, error: servicesError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesError) {
      console.log(`❌ Error fetching existing services:`, servicesError.message);
      return;
    }
    
    console.log(`📊 Found ${existingServices.length} existing services in the database`);
    console.log(`📊 Found ${servicesData.length} original services in the pricing manager's grid`);
    
    // Create a map of cleaned service names to original service IDs
    const serviceNameToIdMap = new Map();
    servicesData.forEach(service => {
      // Clean the service name by removing special characters and extra whitespace
      const cleanedName = service.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
      serviceNameToIdMap.set(cleanedName, service.id);
    });
    
    // Track updated services
    let updatedServicesCount = 0;
    
    for (const existingService of existingServices) {
      // Clean the existing service name
      const cleanedExistingName = existingService.name
        .replace(/\(From.*?\)|\(Different.*?\)|\(Grid.*?\)|(- Price Variant)|\(Copy\)/gi, '') // Remove added descriptors
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .toLowerCase();
      
      // Try to find a match in the original services
      let matchedOriginalService = null;
      for (const [cleanedName, originalId] of serviceNameToIdMap) {
        if (cleanedExistingName.includes(cleanedName) || cleanedName.includes(cleanedExistingName)) {
          // Find the full original service object
          matchedOriginalService = servicesData.find(s => serviceNameToIdMap.get(s.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase()) === originalId);
          break;
        }
      }
      
      if (matchedOriginalService) {
        console.log(`\n🔧 Service matched: "${existingService.name}" → "${matchedOriginalService.name}" (ID: ${matchedOriginalService.id})`);
        
        // Update the service name to match the original if it differs significantly
        if (existingService.name !== matchedOriginalService.name) {
          // Preserve any important suffixes that distinguish variations
          let newName = matchedOriginalService.name;
          if (existingService.name.includes("(Different Pricing)")) {
            newName = `${matchedOriginalService.name} (Different Pricing)`;
          } else if (existingService.name.includes("(Grid Pricing)")) {
            newName = `${matchedOriginalService.name} (Grid Pricing)`;
          } else if (existingService.name.includes("(From Backup:")) {
            newName = `${matchedOriginalService.name} (From Backup: ${existingService.name.match(/\(From Backup: (.+?)\)/)?.[1] || 'Unknown'})`;
          }
          
          try {
            // Update the service name in the database
            const { error: updateError } = await supabase
              .from('services')
              .update({ name: newName })
              .eq('id', existingService.id);
            
            if (updateError) {
              console.log(`     ❌ Error updating service name:`, updateError.message);
            } else {
              console.log(`     ✅ Updated service name to: "${newName}"`);
              updatedServicesCount++;
            }
          } catch (updateErr) {
            console.log(`     ❌ Error updating service:`, updateErr.message);
          }
        }
      } else {
        console.log(`\n❓ No match found for: "${existingService.name}"`);
      }
    }
    
    console.log(`\n✅ Finished fixing naming differences!`);
    console.log(`📊 Updated services count: ${updatedServicesCount}`);
    
    // Now, let's also create a mapping table for future reference
    console.log("\n📝 Creating service ID mapping for future reference...");
    
    // Get the updated services list
    const { data: updatedServices, error: updatedServicesError } = await supabase
      .from('services')
      .select('*');
    
    if (updatedServicesError) {
      console.log(`❌ Error fetching updated services:`, updatedServicesError.message);
      return;
    }
    
    // Create mapping between updated service names and original IDs
    const mapping = [];
    for (const updatedService of updatedServices) {
      const cleanedUpdatedName = updatedService.name
        .replace(/\(From.*?\)|\(Different.*?\)|\(Grid.*?\)|(- Price Variant)|\(Copy\)/gi, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .toLowerCase();
      
      for (const originalService of servicesData) {
        const cleanedOriginalName = originalService.name
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .trim()
          .toLowerCase();
        
        if (cleanedUpdatedName === cleanedOriginalName) {
          mapping.push({
            db_service_id: updatedService.id,
            original_service_id: originalService.id,
            db_service_name: updatedService.name,
            original_service_name: originalService.name
          });
          break;
        }
      }
    }
    
    console.log(`📊 Created mapping for ${mapping.length} services`);
    
    // Save the mapping to a file for future reference
    const mappingFilePath = path.join(__dirname, '..', 'supabase', 'backups', 'service_id_mapping.json');
    fs.writeFileSync(mappingFilePath, JSON.stringify(mapping, null, 2));
    console.log(`💾 Mapping saved to: ${mappingFilePath}`);
    
  } catch (error) {
    console.log(`❌ Error during naming difference fix:`, error.message);
  }
}

// Run the function
fixServiceNamingDifferences()
  .then(() => console.log('\n✨ Naming differences fixed!'))
  .catch(error => console.error('❌ Error:', error));