const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from('service_pricing')
    .select('id, service_id, variant_id, label, date_from, date_to, price, net_price')
    .eq('service_id', 'b935932a-f063-468f-9030-35dca1a7ee07')
    .limit(5);
    
  if (error) {
    console.error(error);
    return;
  }
  console.log("Pricing records in database for Ocean's:", data);
}

main().catch(console.error);
