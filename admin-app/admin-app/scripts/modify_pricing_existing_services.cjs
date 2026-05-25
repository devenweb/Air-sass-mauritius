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
 * Modify pricing of existing services with random variations
 */
async function modifyPricingOfExistingServices() {
  console.log("Fetching existing services and their pricing...");

  // Fetch all pricing records
  const { data: pricingRecords, error: pricingError } = await supabase
    .from('service_pricing')
    .select('*');
  
  if (pricingError) {
    console.error('Error fetching pricing records:', pricingError);
    return;
  }

  console.log(`Found ${pricingRecords.length} pricing records to modify`);

  let modifiedCount = 0;
  
  for (const pricing of pricingRecords) {
    // Calculate a random variation between -20% and +20%
    const variation = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
    
    // Apply the variation to the price
    const newPrice = Math.round(pricing.price * variation * 100) / 100;
    
    // Also vary child, teen, and infant prices
    const newPriceChild = pricing.price_child ? Math.round(pricing.price_child * variation * 100) / 100 : pricing.price_child;
    const newPriceTeen = pricing.price_teen ? Math.round(pricing.price_teen * variation * 100) / 100 : pricing.price_teen;
    const newPriceInfant = pricing.price_infant ? Math.round(pricing.price_infant * variation * 100) / 100 : pricing.price_infant;
    
    // Update the pricing record
    const { error: updateError } = await supabase
      .from('service_pricing')
      .update({
        price: newPrice,
        price_child: newPriceChild,
        price_teen: newPriceTeen,
        price_infant: newPriceInfant,
        updated_at: new Date().toISOString()
      })
      .eq('id', pricing.id);

    if (updateError) {
      console.error(`Error updating pricing record ${pricing.id}:`, updateError);
    } else {
      modifiedCount++;
      console.log(`Updated pricing for record ${pricing.id}: ${pricing.price} → ${newPrice}`);
    }
  }

  console.log(`Successfully modified ${modifiedCount} pricing records`);
}

// Run the modification process
modifyPricingOfExistingServices()
  .then(() => console.log('Pricing modification process completed'))
  .catch(error => console.error('Error during modification process:', error));