const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from('service_pricing')
    .select('id, net_price, price, service_fee')
    .eq('service_id', 'b081c15c-9b79-4bbb-9e7c-debd26ee13ba')
    .limit(5);
    
  if (error) {
    console.error(error);
    return;
  }
  console.log(data);
}

main().catch(console.error);
