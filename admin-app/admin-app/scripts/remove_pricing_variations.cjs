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
 * Removes pricing variations like "+10%", "-10%", "+20%", "-20%" while keeping variant prices
 */
async function removePricingVariations() {
  console.log("Removing pricing variations while keeping variant prices...\n");
  
  try {
    // Get all pricing records that have variations like "+10%", "-10%", "+20%", "-20%" in the label
    const { data: pricingRecords, error: pricingError } = await supabase
      .from('service_pricing')
      .select(`
        id,
        label,
        service_id,
        variant_id,
        date_from,
        date_to,
        price,
        price_child,
        price_teen,
        price_infant,
        currency,
        price_type,
        notes,
        units_available,
        is_stop_sell,
        occupancy_pricing,
        meal_plan_id,
        service_fee,
        net_price,
        net_price_teen,
        net_price_child,
        net_price_infant,
        net_occupancy_pricing,
        capacity,
        duration,
        duration_type
      `);
    
    if (pricingError) {
      console.log(`❌ Error fetching pricing records:`, pricingError.message);
      return;
    }
    
    console.log(`📊 Found ${pricingRecords.length} pricing records in the database`);
    
    // Identify pricing records that have variations to be removed
    const variationPattern = /\(\+10%\)|\(-10%\)|\(\+20%\)|\(-20%\)/i;
    const variationRecords = pricingRecords.filter(pr => variationPattern.test(pr.label));
    
    console.log(`📊 Found ${variationRecords.length} pricing records with variations to remove`);
    
    if (variationRecords.length === 0) {
      console.log("✅ No pricing variations found to remove");
      return;
    }
    
    // Get all services for reference
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name');
    
    if (servicesError) {
      console.log(`❌ Error fetching services:`, servicesError.message);
      return;
    }
    
    // Create a service ID to name mapping
    const serviceNameMap = new Map();
    services.forEach(service => {
      serviceNameMap.set(service.id, service.name);
    });
    
    // Counters for tracking
    let removedCount = 0;
    let keptCount = 0;
    
    // Delete the variation records
    for (const record of variationRecords) {
      // Check if there are other pricing records for the same service with actual variant IDs
      // We want to preserve true variants (with variant_id) and only remove the artificially created variations
      const isArtificialVariation = !record.variant_id && variationPattern.test(record.label);
      
      if (isArtificialVariation) {
        console.log(`\n🗑️  Removing artificial variation: "${record.label}" for service: ${serviceNameMap.get(record.service_id)} (ID: ${record.service_id})`);
        
        try {
          const { error: deleteError } = await supabase
            .from('service_pricing')
            .delete()
            .eq('id', record.id);
          
          if (deleteError) {
            console.log(`     ❌ Error deleting pricing record:`, deleteError.message);
          } else {
            console.log(`     ✅ Removed pricing variation: "${record.label}"`);
            removedCount++;
          }
        } catch (deleteErr) {
          console.log(`     ❌ Error removing pricing variation:`, deleteErr.message);
        }
      } else {
        console.log(`\n⏭️  Keeping variant record: "${record.label}" for service: ${serviceNameMap.get(record.service_id)} (has variant_id: ${record.variant_id})`);
        keptCount++;
      }
    }
    
    console.log(`\n✅ Finished removing pricing variations!`);
    console.log(`📊 Removed: ${removedCount} records`);
    console.log(`📊 Kept: ${keptCount} records`);
    
  } catch (error) {
    console.log(`❌ Error during pricing variation removal:`, error.message);
  }
}

// Run the function
removePricingVariations()
  .then(() => console.log('\n✨ Complete!'))
  .catch(error => console.error('❌ Error:', error));