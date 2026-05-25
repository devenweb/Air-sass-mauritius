import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface CategoryTestCase {
  slug: string
  name: string
  categoryId: string
  serviceType: string
  region: string
  useOccupancyPricing: boolean
}

const CATEGORY_TESTS: CategoryTestCase[] = [
  {
    slug: 'flights',
    name: 'Flight',
    categoryId: 'ca62a70a-0550-4df6-bba3-cef15ca24bb5',
    serviceType: 'flight',
    region: 'International',
    useOccupancyPricing: false
  },
  {
    slug: 'hotels',
    name: 'Hotels',
    categoryId: '56353e25-85ff-442b-ab69-4fd885fe61a9',
    serviceType: 'hotel',
    region: 'North Coast',
    useOccupancyPricing: true
  },
  {
    slug: 'activities',
    name: 'Activities',
    categoryId: '3303bb90-b905-4c85-a163-84743c54da1c',
    serviceType: 'activity',
    region: 'West Coast',
    useOccupancyPricing: false
  },
  {
    slug: 'travel-packages',
    name: 'Travel Packages',
    categoryId: '2e515f0a-521c-43ec-ac18-195394f6359b',
    serviceType: 'package',
    region: 'Dubai',
    useOccupancyPricing: false
  },
  {
    slug: 'cruises',
    name: 'Cruises',
    categoryId: '4881005a-bb2c-4fb5-84bf-f7ed52bd66e8',
    serviceType: 'cruise',
    region: 'East Coast',
    useOccupancyPricing: false
  },
  {
    slug: 'tours',
    name: 'Group Tours',
    categoryId: '2f986fcf-b132-41fd-b465-2b0b958d5e91',
    serviceType: 'tour',
    region: 'South Coast',
    useOccupancyPricing: false
  },
  {
    slug: 'rodrigues',
    name: 'Rodrigues',
    categoryId: '50477126-e894-4f6b-acb2-b11071808818',
    serviceType: 'hotel',
    region: 'Rodrigues',
    useOccupancyPricing: true
  },
  {
    slug: 'day-packages',
    name: 'Day Packages',
    categoryId: '95acff75-031e-4a01-8255-f7a3019824d7',
    serviceType: 'day_package',
    region: 'North Coast',
    useOccupancyPricing: false
  },
  {
    slug: 'mauritius',
    name: 'Mauritius',
    categoryId: '9693fae3-c87d-4fa6-986c-48c377663198',
    serviceType: 'hotel',
    region: 'East Coast',
    useOccupancyPricing: true
  },
  {
    slug: 'evening-packages',
    name: 'Evening Packages',
    categoryId: '8cfd2de9-fd5b-40b5-89cf-ec712b8dcf56',
    serviceType: 'evening_package',
    region: 'South Coast',
    useOccupancyPricing: false
  }
]

async function run() {
  console.log('========================================================================')
  console.log('🚀 RUNNING ALL 10 SERVICE CATEGORIES BACKEND CRUD VALIDATION')
  console.log('========================================================================\n')

  let totalFailed = 0

  for (const testCase of CATEGORY_TESTS) {
    console.log(`------------------------------------------------------------------------`)
    console.log(`🔄 TESTING CATEGORY: "${testCase.name}" (Slug: ${testCase.slug})`)
    console.log(`------------------------------------------------------------------------`)

    const timestamp = Date.now()
    const testName = `_TEST_CRUD_${testCase.slug.toUpperCase()}_${timestamp}`
    let testServiceId: string | null = null

    try {
      // 1. CREATE (Insert Service)
      console.log(`[CREATE] Inserting test service: "${testName}"...`)
      const { data: createdSvc, error: createErr } = await supabase
        .from('services')
        .insert([{
          name: testName,
          service_type: testCase.serviceType,
          is_active: true,
          status: 'active',
          location: 'Test Location',
          region: testCase.region,
          description: `Temporary integration test service for ${testCase.name}.`,
          short_description: `Temp test for ${testCase.name}.`
        }])
        .select()
        .single()

      if (createErr || !createdSvc) {
        throw new Error(`CREATE failed: ${createErr?.message || 'No data returned'}`)
      }
      testServiceId = createdSvc.id
      console.log(`   ✅ Success! Created Service ID: ${testServiceId}`)

      // 2. LINK (Insert service_categories relationship)
      console.log(`[LINK] Associating service with category ID: ${testCase.categoryId}...`)
      const { error: linkErr } = await supabase
        .from('service_categories')
        .insert([{
          service_id: testServiceId,
          category_id: testCase.categoryId
        }])

      if (linkErr) {
        throw new Error(`LINK failed: ${linkErr.message}`)
      }
      console.log(`   ✅ Success! Category link created.`)

      // 3. PRICING (Insert service_pricing record)
      const futureDate = '2026-12-31'
      const initialPrice = 12500
      console.log(`[PRICING] Creating active future pricing (price: Rs ${initialPrice})...`)
      
      const pricingPayload: any = {
        service_id: testServiceId,
        currency: 'MUR',
        date_from: new Date().toISOString().split('T')[0],
        date_to: futureDate,
        price_type: 'per_person',
        net_price: initialPrice
      }

      if (testCase.useOccupancyPricing) {
        pricingPayload.net_occupancy_pricing = { "2": { "price": initialPrice } }
      }

      const { error: pricingErr } = await supabase
        .from('service_pricing')
        .insert([pricingPayload])

      if (pricingErr) {
        throw new Error(`PRICING failed: ${pricingErr.message}`)
      }
      console.log(`   ✅ Success! Pricing record created.`)

      // 4. READ (Query service and verify lead price resolution)
      console.log(`[READ] Simulating frontend query and calculating lead price...`)
      
      // Fetch service and category slug
      const { data: queriedSvc, error: queryErr } = await supabase
        .from('services')
        .select(`
          id, 
          name, 
          service_type, 
          is_active,
          region,
          service_categories!inner(categories!inner(slug))
        `)
        .eq('id', testServiceId)
        .single()

      if (queryErr || !queriedSvc) {
        throw new Error(`READ failed to query service: ${queryErr?.message || 'Not found'}`)
      }

      // Fetch pricing details
      const { data: pricingRecords, error: priceFetchErr } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_id', testServiceId)
        .gte('date_to', new Date().toISOString().split('T')[0])

      if (priceFetchErr || !pricingRecords || pricingRecords.length === 0) {
        throw new Error(`READ failed to retrieve pricing: ${priceFetchErr?.message || 'No active pricing records'}`)
      }

      // Resolve lead price manually based on core code rules
      const priceRecord = pricingRecords[0]
      let resolvedPrice = 0
      const isHotel = ['hotel', 'hotels', 'stays'].includes(queriedSvc.service_type?.toLowerCase() || '')
      
      if (isHotel && priceRecord.occupancy_pricing && typeof priceRecord.occupancy_pricing === 'object' && priceRecord.occupancy_pricing['2']) {
        const v = priceRecord.occupancy_pricing['2']
        resolvedPrice = typeof v === 'object' && v !== null ? Number(v.price || v.adult || 0) : Number(v || 0)
      } else {
        resolvedPrice = Number(priceRecord.price || 0)
      }

      console.log(`   ✅ Success! Retrieved Name: "${queriedSvc.name}" | Resolved Price: Rs ${resolvedPrice}`)
      if (resolvedPrice !== initialPrice) {
        throw new Error(`READ verification failed! Expected lead price to be Rs ${initialPrice}, but got Rs ${resolvedPrice}`)
      }

      // 5. UPDATE (Edit service name and pricing)
      const updatedName = `${testName}_EDITED`
      const updatedPrice = 14500
      console.log(`[UPDATE] Modifying service name to "${updatedName}" and price to Rs ${updatedPrice}...`)

      // Update name
      const { error: nameUpdateErr } = await supabase
        .from('services')
        .update({ name: updatedName })
        .eq('id', testServiceId)

      if (nameUpdateErr) {
        throw new Error(`UPDATE failed (name): ${nameUpdateErr.message}`)
      }

      // Update pricing
      const updatePayload: any = {}
      if (testCase.useOccupancyPricing) {
        updatePayload.net_occupancy_pricing = { "2": { "price": updatedPrice } }
      } else {
        updatePayload.net_price = updatedPrice
      }

      const { error: priceUpdateErr } = await supabase
        .from('service_pricing')
        .update(updatePayload)
        .eq('service_id', testServiceId)

      if (priceUpdateErr) {
        throw new Error(`UPDATE failed (pricing): ${priceUpdateErr.message}`)
      }

      // Verify updates
      const { data: doubleCheckSvc, error: checkErr } = await supabase
        .from('services')
        .select('name')
        .eq('id', testServiceId)
        .single()

      const { data: doubleCheckPricing, error: checkPricingErr } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('service_id', testServiceId)

      if (checkErr || checkPricingErr || !doubleCheckSvc || !doubleCheckPricing || doubleCheckPricing.length === 0) {
        throw new Error(`UPDATE check failed: ${checkErr?.message || checkPricingErr?.message || 'No data'}`)
      }

      let doubleCheckResolvedPrice = 0
      const checkRecord = doubleCheckPricing[0]
      if (isHotel && checkRecord.occupancy_pricing && typeof checkRecord.occupancy_pricing === 'object' && checkRecord.occupancy_pricing['2']) {
        const v = checkRecord.occupancy_pricing['2']
        doubleCheckResolvedPrice = typeof v === 'object' && v !== null ? Number(v.price || v.adult || 0) : Number(v || 0)
      } else {
        doubleCheckResolvedPrice = Number(checkRecord.price || 0)
      }

      if (doubleCheckSvc.name !== updatedName || doubleCheckResolvedPrice !== updatedPrice) {
        throw new Error(`UPDATE values mismatch! Expected Name: "${updatedName}", Price: ${updatedPrice}. Got Name: "${doubleCheckSvc.name}", Price: ${doubleCheckResolvedPrice}`)
      }
      console.log(`   ✅ Success! Verified edits: Name is now "${doubleCheckSvc.name}" | Price is Rs ${doubleCheckResolvedPrice}`)

      // 6. DELETE (Clean up)
      console.log(`[DELETE] Cleaning up test records...`)
      
      // Delete pricing
      const { error: delPricingErr } = await supabase
        .from('service_pricing')
        .delete()
        .eq('service_id', testServiceId)
      if (delPricingErr) console.warn(`   ⚠️ Failed to delete pricing: ${delPricingErr.message}`)

      // Delete categories relationship
      const { error: delCatErr } = await supabase
        .from('service_categories')
        .delete()
        .eq('service_id', testServiceId)
      if (delCatErr) console.warn(`   ⚠️ Failed to delete category mapping: ${delCatErr.message}`)

      // Delete service
      const { error: delSvcErr } = await supabase
        .from('services')
        .delete()
        .eq('id', testServiceId)
      if (delSvcErr) console.warn(`   ⚠️ Failed to delete service: ${delSvcErr.message}`)

      console.log(`   ✅ Success! Test records successfully deleted.`)
      console.log(`🎉 CATEGORY "${testCase.name}" CRUD PIPELINE COMPLETED SUCCESSFULLY!`)

    } catch (err: any) {
      console.error(`❌ CATEGORY "${testCase.name}" FAILED WITH ERROR:`, err.message)
      totalFailed++

      // Fallback cleanup if service ID exists
      if (testServiceId) {
        console.log(`   🧹 Running emergency cleanup for Service ID: ${testServiceId}...`)
        await supabase.from('service_pricing').delete().eq('service_id', testServiceId)
        await supabase.from('service_categories').delete().eq('service_id', testServiceId)
        await supabase.from('services').delete().eq('id', testServiceId)
      }
    }
  }

  console.log('\n========================================================================')
  if (totalFailed > 0) {
    console.error(`❌ CRUD VALIDATION COMPLETED. ${totalFailed} CATEGORIES FAILED.`)
    process.exit(1)
  } else {
    console.log(`✅ CRUD VALIDATION COMPLETED successfully. ALL 10 CATEGORIES PASSED!`)
    process.exit(0)
  }
}

run()
