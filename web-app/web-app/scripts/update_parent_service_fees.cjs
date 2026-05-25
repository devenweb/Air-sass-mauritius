const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Updating Malaysia Package...");
  const { data: d1, error: e1 } = await supabase
    .from('services')
    .update({ service_fee: 10 })
    .eq('id', 'b081c15c-9b79-4bbb-9e7c-debd26ee13ba')
    .select();
    
  console.log("Malaysia update:", d1, e1);
  
  console.log("Updating Ocean's Creek Beach Hotel...");
  const { data: d2, error: e2 } = await supabase
    .from('services')
    .update({ service_fee: 10 })
    .eq('id', 'b935932a-f063-468f-9030-35dca1a7ee07')
    .select();
    
  console.log("Ocean's update:", d2, e2);
}

main().catch(console.error);
