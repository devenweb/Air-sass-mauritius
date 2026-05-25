const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ids = [
  '2bd1fc11-5fa6-4685-b464-ca13100852c7',
  '33b3f653-4e53-4c18-a806-f867f04aff0f',
  '3ac0e9f8-5eaa-4443-95b6-5560f73e6dfd',
  '9d86212b-1552-41ce-8032-7ee8fd6707fe',
  'b935932a-f063-468f-9030-35dca1a7ee07',
  'cc048a17-ed96-4e01-9640-c855954bcb51'
];

async function main() {
  const { data, error } = await supabase
    .from('services')
    .select('id, name')
    .in('id', ids);
  console.log("Matching live services:", data, error);
}

main().catch(console.error);
