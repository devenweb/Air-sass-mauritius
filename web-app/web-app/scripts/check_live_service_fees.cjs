const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, service_fee')
    .in('id', ['b081c15c-9b79-4bbb-9e7c-debd26ee13ba', 'b935932a-f063-468f-9030-35dca1a7ee07']);
    
  if (error) {
    console.error(error);
    return;
  }
  console.log(services);
}

main().catch(console.error);
