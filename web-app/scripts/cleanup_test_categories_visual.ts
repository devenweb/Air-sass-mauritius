import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('========================================================================')
  console.log('🧹 CLEANING UP SEEDED VISUAL TEST SERVICES')
  console.log('========================================================================\n')

  try {
    // Find all services starting with _TEST_VISUAL_
    const { data: testSvcs, error: fetchErr } = await supabase
      .from('services')
      .select('id, name')
      .like('name', '_TEST_VISUAL_%')

    if (fetchErr) {
      throw new Error(`Failed to fetch test services: ${fetchErr.message}`)
    }

    if (!testSvcs || testSvcs.length === 0) {
      console.log('No visual test services found to clean up. Database is already clean.')
      process.exit(0)
    }

    console.log(`Found ${testSvcs.length} visual test services. Commencing deletion...`)

    const ids = testSvcs.map(s => s.id)

    // 1. Delete pricing
    const { error: delPricingErr } = await supabase
      .from('service_pricing')
      .delete()
      .in('service_id', ids)
    if (delPricingErr) console.warn('⚠️ Warning: Failed to delete pricing entries:', delPricingErr.message)
    else console.log('   ✅ Deleted test pricing entries.')

    // 2. Delete category mappings
    const { error: delCatErr } = await supabase
      .from('service_categories')
      .delete()
      .in('service_id', ids)
    if (delCatErr) console.warn('⚠️ Warning: Failed to delete category mappings:', delCatErr.message)
    else console.log('   ✅ Deleted test category mappings.')

    // 3. Delete services
    const { error: delSvcErr } = await supabase
      .from('services')
      .delete()
      .in('id', ids)
    if (delSvcErr) console.warn('⚠️ Warning: Failed to delete services:', delSvcErr.message)
    else console.log('   ✅ Deleted test services.')

    console.log('\nCleanup visual test items complete. Database is back to pristine state.')

  } catch (err: any) {
    console.error('❌ Emergency cleanup failed:', err.message)
  }
}

run()
