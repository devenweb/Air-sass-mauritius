// import { createClient } from '@supabase/supabase-js';
// import * as dotenv from 'dotenv';
// 
// dotenv.config({ path: '.env.local' });
// 
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// 
// const supabase = createClient(supabaseUrl, supabaseServiceKey);
// 
// async function main() {
//   console.log('Fetching duplicate services to clean up...');
//   
//   const { data: services, error } = await supabase
//     .from('services')
//     .select('id, name')
//     .ilike('name', '%(From Backup:%');
// 
//   if (error) {
//     console.error('Error fetching services:', error);
//     return;
//   }
// 
//   console.log(`Found ${services?.length || 0} duplicate services to delete.`);
// 
//   if (!services || services.length === 0) {
//     return;
//   }
// 
//   for (const svc of services) {
//     console.log(`Deleting service: "${svc.name}" (${svc.id})...`);
//     const { error: deleteError } = await supabase
//       .from('services')
//       .delete()
//       .eq('id', svc.id);
// 
//     if (deleteError) {
//       console.error(`  ❌ Error deleting service ${svc.name}:`, deleteError.message);
//     } else {
//       console.log(`  ✅ Deleted successfully.`);
//     }
//   }
// 
//   console.log('Cleanup complete!');
// }
// 
// main().catch(console.error);
console.log('Cleanup script is disabled for safety.');



