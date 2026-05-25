const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const id = 'db0bf0fc-8989-4228-8e5f-e9b0b22a3138';
  console.log(`Fetching record ${id} before update...`);
  const { data: before, error: errBefore } = await supabase.from('service_pricing').select('*').eq('id', id).single();
  console.log("Before update:", before);
  
  console.log(`Updating record ${id} to net_price = 21500...`);
  const { data: after, error: errAfter } = await supabase
    .from('service_pricing')
    .update({ net_price: 21500 })
    .eq('id', id)
    .select();
    
  if (errAfter) {
    console.error("Update error:", errAfter);
  } else {
    console.log("After update:", after);
  }
}

main().catch(console.error);
