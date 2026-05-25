const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data: services, error } = await supabase
    .from('services')
    .select('id, name')
    .ilike('name', '%Ocean%');
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Live services containing 'Ocean':");
  services.forEach(s => {
    console.log(`- "${s.name}" (ID: ${s.id})`);
  });
}

main().catch(console.error);
