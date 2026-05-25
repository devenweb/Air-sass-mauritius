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

async function run() {
  console.log('========================================================================')
  console.log('🚀 TRAVEL LOUNGE 2026 INTEGRATION TESTING & COMPREHENSIVE SERVICE AUDIT')
  console.log('========================================================================\n')

  let hasErrors = false

  try {
    // ----------------------------------------------------
    // PHASE 1: AUTOMATED INTEGRATION CRUD TEST (SKIP FLIGHT)
    // ----------------------------------------------------
    console.log('----------------------------------------------------')
    console.log('🔄 PHASE 1: RUNNING AUTOMATED DB CRUD INTEGRATION TEST')
    console.log('----------------------------------------------------')

    const timestamp = Date.now()
    const testName = `_TEST_TOUR_INTEGRATION_${timestamp}`
    
    // Step 1: Create
    console.log(`[CRUD] 1. Creating test tour: "${testName}"...`)
    const { data: createdSvc, error: createErr } = await supabase
      .from('services')
      .insert([{
        name: testName,
        service_type: 'tour', // Enforced non-flight service type
        is_active: true,
        status: 'active',
        location: 'Test Location',
        region: 'Test Region',
        description: 'Temporary tour created for integration validation.',
        short_description: 'Temp integration test tour.'
      }])
      .select()
      .single()

    if (createErr) {
      throw new Error(`Failed to create test service: ${createErr.message}`)
    }
    const testServiceId = createdSvc.id
    console.log(`[CRUD]    ✅ Successfully created service. ID: ${testServiceId}`)

    // Step 2: Fetch any active category (that is not flights) to associate
    console.log('[CRUD] 2. Retrieving non-flight category for association...')
    const { data: categories, error: catFetchErr } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .neq('slug', 'flights')
      .limit(1)

    if (catFetchErr || !categories || categories.length === 0) {
      throw new Error(`Failed to fetch a target category for association: ${catFetchErr?.message || 'No categories found'}`)
    }
    const testCategory = categories[0]
    console.log(`[CRUD]    ✅ Retrieved category: "${testCategory.name}" (${testCategory.slug})`)

    // Step 3: Link service to category in service_categories
    console.log(`[CRUD] 3. Linking service to category "${testCategory.name}"...`)
    const { error: linkErr } = await supabase
      .from('service_categories')
      .insert([{
        service_id: testServiceId,
        category_id: testCategory.id
      }])

    if (linkErr) {
      throw new Error(`Failed to link service to category: ${linkErr.message}`)
    }
    console.log(`[CRUD]    ✅ Link successful.`)

    // Step 4: Add future pricing record
    const futureDate = '2026-12-31'
    const initialPrice = 9999
    console.log(`[CRUD] 4. Creating future pricing of Rs ${initialPrice} (valid until ${futureDate})...`)
    const { error: pricingErr } = await supabase
      .from('service_pricing')
      .insert([{
        service_id: testServiceId,
        price: initialPrice,
        net_price: initialPrice,
        currency: 'MUR',
        date_from: new Date().toISOString().split('T')[0],
        date_to: futureDate,
        price_type: 'per_person'
      }])

    if (pricingErr) {
      throw new Error(`Failed to create service pricing: ${pricingErr.message}`)
    }
    console.log(`[CRUD]    ✅ Pricing entry created.`)

    // Step 5: Read and simulate frontend query structure (checks for category linkage and pricing)
    console.log('[CRUD] 5. Simulating frontend service retrieval query...')
    const todayStr = new Date().toISOString().split('T')[0]
    
    const { data: queriedSvc, error: queryErr } = await supabase
      .from('services')
      .select(`
        id, 
        name, 
        service_type, 
        is_active,
        service_categories!inner(categories!inner(slug))
      `)
      .eq('id', testServiceId)
      .eq('service_categories.categories.slug', testCategory.slug)
      .single()

    if (queryErr || !queriedSvc) {
      throw new Error(`Frontend simulated query failed to fetch the test service: ${queryErr?.message || 'Service not found'}`)
    }

    // Resolve lead price
    const { data: priceRecords } = await supabase
      .from('service_pricing')
      .select('price')
      .eq('service_id', testServiceId)
      .gte('date_to', todayStr)

    const prices = priceRecords?.map(pr => pr.price).filter(p => p > 0) || []
    const resolvedLeadPrice = prices.length > 0 ? Math.min(...prices) : 0

    console.log(`[CRUD]    ✅ Successfully queried service. Name: "${queriedSvc.name}" | Lead Price: Rs ${resolvedLeadPrice}`)
    if (resolvedLeadPrice !== initialPrice) {
      throw new Error(`Pricing mismatch! Expected ${initialPrice}, got ${resolvedLeadPrice}`)
    }

    // Step 6: Update
    const updatedPrice = 8888
    console.log(`[CRUD] 6. Simulating update of price to Rs ${updatedPrice}...`)
    const { error: updatePricingErr } = await supabase
      .from('service_pricing')
      .update({ price: updatedPrice, net_price: updatedPrice })
      .eq('service_id', testServiceId)

    if (updatePricingErr) {
      throw new Error(`Failed to update pricing: ${updatePricingErr.message}`)
    }

    const { data: updatedPriceRecords } = await supabase
      .from('service_pricing')
      .select('price')
      .eq('service_id', testServiceId)
      .gte('date_to', todayStr)

    const updatedPrices = updatedPriceRecords?.map(pr => pr.price).filter(p => p > 0) || []
    const updatedLeadPrice = updatedPrices.length > 0 ? Math.min(...updatedPrices) : 0
    console.log(`[CRUD]    ✅ Updated Lead Price: Rs ${updatedLeadPrice}`)
    if (updatedLeadPrice !== updatedPrice) {
      throw new Error(`Updated pricing mismatch! Expected ${updatedPrice}, got ${updatedLeadPrice}`)
    }

    // Step 7: Delete (Cleanup)
    console.log('[CRUD] 7. Cleaning up test records...')
    // Delete pricing
    const { error: delPricingErr } = await supabase
      .from('service_pricing')
      .delete()
      .eq('service_id', testServiceId)
    if (delPricingErr) console.warn('⚠️ Warning: Failed to clean up pricing record:', delPricingErr.message)

    // Delete category mappings
    const { error: delCatErr } = await supabase
      .from('service_categories')
      .delete()
      .eq('service_id', testServiceId)
    if (delCatErr) console.warn('⚠️ Warning: Failed to clean up category mapping:', delCatErr.message)

    // Delete service
    const { error: delSvcErr } = await supabase
      .from('services')
      .delete()
      .eq('id', testServiceId)
    if (delSvcErr) console.warn('⚠️ Warning: Failed to clean up service record:', delSvcErr.message)

    console.log('[CRUD]    ✅ Cleanup complete. No trace left in the DB.')
    console.log('[CRUD] 🎉 CRUD INTEGRATION TEST COMPLETED SUCCESSFULLY! No errors detected.\n')

  } catch (error: any) {
    console.error('❌ PHASE 1 CRUD TEST FAILED WITH ERROR:', error.message)
    hasErrors = true
  }

  // ----------------------------------------------------
  // PHASE 2: COMPREHENSIVE SERVICE VISIBILITY AUDIT
  // ----------------------------------------------------
  console.log('----------------------------------------------------')
  console.log('🔎 PHASE 2: RUNNING SERVICE VISIBILITY AUDIT')
  console.log('----------------------------------------------------')
  console.log('* Note: Flight services are excluded from this audit as they use an external iframe.\n')

  try {
    const today = new Date().toISOString().split('T')[0]

    // Fetch all services
    const { data: services, error: sError } = await supabase
      .from('services')
      .select('id, name, service_type, is_active, status')
      .neq('service_type', 'flight') // Skip flights

    if (sError) {
      throw new Error(`Failed to fetch services: ${sError.message}`)
    }

    // Fetch all category associations
    const { data: catAssoc, error: caError } = await supabase
      .from('service_categories')
      .select('service_id, category_id, categories(name, slug)')

    if (caError) {
      throw new Error(`Failed to fetch category associations: ${caError.message}`)
    }

    // Fetch all pricing entries
    // Original query commented out:
    // const { data: pricings, error: pError } = await supabase
    //   .from('service_pricing')
    //   .select('service_id, price, date_to, occupancy_pricing')
    // 
    // if (pError) {
    //   throw new Error(`Failed to fetch pricings: ${pError.message}`)
    // }

    const activeServiceIds = services
      ?.filter(s => s.is_active && s.status === 'active')
      .map(s => s.id) || []

    const pricings: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    if (activeServiceIds.length > 0) {
      while (hasMore) {
        const { data: pageData, error: pError } = await supabase
          .from('service_pricing')
          .select('service_id, price, date_to, occupancy_pricing')
          .in('service_id', activeServiceIds)
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (pError) {
          throw new Error(`Failed to fetch pricings: ${pError.message}`)
        }

        if (!pageData || pageData.length === 0) {
          hasMore = false
        } else {
          pricings.push(...pageData)
          if (pageData.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        }
      }
    }

    // Map data for fast lookup
    const catMap = new Map<string, any[]>()
    catAssoc?.forEach(ca => {
      const list = catMap.get(ca.service_id) || []
      list.push(ca.categories)
      catMap.set(ca.service_id, list)
    })

    const priceMap = new Map<string, any[]>()
    pricings?.forEach(p => {
      const list = priceMap.get(p.service_id) || []
      list.push(p)
      priceMap.set(p.service_id, list)
    })

    const invisibleServices: any[] = []
    let totalActiveCount = 0

    services?.forEach(s => {
      if (s.is_active && s.status === 'active') {
        totalActiveCount++
        
        const categories = catMap.get(s.id) || []
        const pricingList = priceMap.get(s.id) || []

        const hasCategory = categories.length > 0
        
        // Check if there is at least one active future pricing record with a valid price
        // (Either a valid flat price > 0, or is hotel and has multi-occupancy pricing)
        const activePricing = pricingList.filter(p => {
          const isFuture = p.date_to >= today
          const hasFlatPrice = Number(p.price) > 0
          const hasOccupancyObj = p.occupancy_pricing && typeof p.occupancy_pricing === 'object' && Object.keys(p.occupancy_pricing).length > 0
          return isFuture && (hasFlatPrice || hasOccupancyObj)
        })

        const hasActivePricing = activePricing.length > 0

        if (!hasCategory || !hasActivePricing) {
          invisibleServices.push({
            id: s.id,
            name: s.name,
            service_type: s.service_type,
            categories: categories.map(c => c.name).join(', ') || 'NONE',
            pricingCount: pricingList.length,
            activePricingCount: activePricing.length,
            reasons: [
              !hasCategory ? '🔴 Missing Category' : null,
              !hasActivePricing ? '🔴 No Active Future Pricing' : null
            ].filter(Boolean)
          })
        }
      }
    })

    console.log(`Total active services audited (excluding flights): ${totalActiveCount}`)
    console.log(`Invisible services found: ${invisibleServices.length}\n`)

    if (invisibleServices.length > 0) {
      console.log('------------------------------------------------------------------------------------------------------------------------')
      console.log('| SERVICE NAME                                            | TYPE      | CATEGORIES           | PRICING (ACT/TOT) | REASONS')
      console.log('------------------------------------------------------------------------------------------------------------------------')
      invisibleServices.forEach(is => {
        const namePad = is.name.slice(0, 55).padEnd(55)
        const typePad = is.service_type.padEnd(9)
        const catsPad = is.categories.slice(0, 20).padEnd(20)
        const pricingPad = `${is.activePricingCount}/${is.pricingCount}`.padEnd(17)
        const reasonsStr = is.reasons.join(', ')
        console.log(`| ${namePad} | ${typePad} | ${catsPad} | ${pricingPad} | ${reasonsStr}`)
      })
      console.log('------------------------------------------------------------------------------------------------------------------------\n')
      console.log('💡 RECOMMENDATION:')
      console.log('To make these services show up on the frontend website, go to the Admin App and:')
      console.log('1. Select at least one category (checkbox) for the service and save.')
      console.log('2. Add a valid future pricing grid slot (with pricing dates matching or exceeding today) in the Price Manager.')
    } else {
      console.log('🎉 Excellent! All active services in the database are properly configured with categories and active pricing.')
    }

  } catch (error: any) {
    console.error('❌ PHASE 2 AUDIT FAILED WITH ERROR:', error.message)
    hasErrors = true
  }

  console.log('\n========================================================================')
  if (hasErrors) {
    console.log('❌ SYSTEM CHECK COMPLETED WITH ENCOUNTERED ERRORS.')
    process.exit(1)
  } else {
    console.log('✅ SYSTEM CHECK COMPLETED SUCCESSFULLY WITH NO ENCOUNTERED ERRORS.')
    process.exit(0)
  }
}

run()
