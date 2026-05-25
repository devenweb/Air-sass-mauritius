const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const testId = 'aed9f138-f38c-45d0-a341-d819120c0aa9';
  console.log(`Inspecting record ID: ${testId}`);
  
  const { data: before, error: err1 } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('id', testId)
    .single();
    
  if (err1) {
    console.error("Error fetching before:", err1);
    return;
  }
  
  console.log("Before update:", {
    net_price: before.net_price,
    price: before.price,
    service_fee: before.service_fee
  });
  
  const newNetPrice = before.net_price === 1000 ? 2000 : 1000;
  console.log(`Updating net_price to ${newNetPrice}...`);
  
  const { data: updateRes, error: err2 } = await supabase
    .from('service_pricing')
    .update({ net_price: newNetPrice })
    .eq('id', testId)
    .select()
    .single();
    
  if (err2) {
    console.error("Error updating:", err2);
    return;
  }
  
  console.log("Immediately after update (returned data):", {
    net_price: updateRes.net_price,
    price: updateRes.price,
    service_fee: updateRes.service_fee
  });
  
  const { data: after, error: err3 } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('id', testId)
    .single();
    
  if (err3) {
    console.error("Error fetching after:", err3);
    return;
  }
  
  console.log("Re-fetched after update:", {
    net_price: after.net_price,
    price: after.price,
    service_fee: after.service_fee
  });
  
  // Restore original
  console.log("Restoring original net_price...");
  await supabase
    .from('service_pricing')
    .update({ net_price: before.net_price })
    .eq('id', testId);
}

main().catch(console.error);
