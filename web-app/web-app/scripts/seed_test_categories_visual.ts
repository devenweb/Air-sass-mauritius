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

interface SeedItem {
  slug: string
  name: string
  categoryId: string
  serviceType: string
  region: string
  price: number
  useOccupancyPricing: boolean
}

const SEED_ITEMS: SeedItem[] = [
  {
    slug: 'flights',
    name: '_TEST_VISUAL_FLIGHT',
    categoryId: 'ca62a70a-0550-4df6-bba3-cef15ca24bb5',
    serviceType: 'flight',
    region: 'International',
    price: 5500,
    useOccupancyPricing: false
  },
  {
    slug: 'hotels',
    name: '_TEST_VISUAL_HOTEL',
    categoryId: '56353e25-85ff-442b-ab69-4fd885fe61a9',
    serviceType: 'hotel',
    region: 'North Coast',
    price: 11500,
    useOccupancyPricing: true
  },
  {
    slug: 'activities',
    name: '_TEST_VISUAL_ACTIVITY',
    categoryId: '3303bb90-b905-4c85-a163-84743c54da1c',
    serviceType: 'activity',
    region: 'West Coast',
    price: 3500,
    useOccupancyPricing: false
  },
  {
    slug: 'travel-packages',
    name: '_TEST_VISUAL_TRAVEL_PACKAGE',
    categoryId: '2e515f0a-521c-43ec-ac18-195394f6359b',
    serviceType: 'package',
    region: 'Dubai',
    price: 45000,
    useOccupancyPricing: false
  },
  {
    slug: 'cruises',
    name: '_TEST_VISUAL_CRUISE',
    categoryId: '4881005a-bb2c-4fb5-84bf-f7ed52bd66e8',
    serviceType: 'cruise',
    region: 'East Coast',
    price: 18500,
    useOccupancyPricing: false
  },
  {
    slug: 'tours',
    name: '_TEST_VISUAL_GROUP_TOUR',
    categoryId: '2f986fcf-b132-41fd-b465-2b0b958d5e91',
    serviceType: 'tour',
    region: 'South Coast',
    price: 9500,
    useOccupancyPricing: false
  },
  {
    slug: 'rodrigues',
    name: '_TEST_VISUAL_RODRIGUES',
    categoryId: '50477126-e894-4f6b-acb2-b11071808818',
    serviceType: 'hotel',
    region: 'Rodrigues',
    price: 12500,
    useOccupancyPricing: true
  },
  {
    slug: 'day-packages',
    name: '_TEST_VISUAL_DAY_PACKAGE',
    categoryId: '95acff75-031e-4a01-8255-f7a3019824d7',
    serviceType: 'day_package',
    region: 'North Coast',
    price: 2800,
    useOccupancyPricing: false
  },
  {
    slug: 'mauritius',
    name: '_TEST_VISUAL_MAURITIUS',
    categoryId: '9693fae3-c87d-4fa6-986c-48c377663198',
    serviceType: 'hotel',
    region: 'East Coast', // Fits in Mauritius region filter North/East/South/West
    price: 13500,
    useOccupancyPricing: true
  },
  {
    slug: 'evening-packages',
    name: '_TEST_VISUAL_EVENING_PACKAGE',
    categoryId: '8cfd2de9-fd5b-40b5-89cf-ec712b8dcf56',
    serviceType: 'evening_package',
    region: 'South Coast',
    price: 4200,
    useOccupancyPricing: false
  }
]

async function run() {
  console.log('========================================================================')
  console.log('🌱 SEEDING VISUAL TEST SERVICES FOR FRONTEND VERIFICATION')
  console.log('========================================================================\n')

  for (const item of SEED_ITEMS) {
    try {
      console.log(`[SEED] Seeding "${item.name}"...`)
      
      // 1. Insert service
      const { data: svc, error: svcErr } = await supabase
        .from('services')
        .insert([{
          name: item.name,
          service_type: item.serviceType,
          is_active: true,
          status: 'active',
          location: 'Grand Baie, Mauritius',
          region: item.region,
          description: `This is a test service for category ${item.slug}. It will be cleaned up shortly.`,
          short_description: `Test visual service for ${item.slug}.`,
          image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80' // Beautiful default beach image
        }])
        .select()
        .single()

      if (svcErr || !svc) {
        throw new Error(`Failed to create service: ${svcErr?.message}`)
      }

      // 2. Link category
      const { error: linkErr } = await supabase
        .from('service_categories')
        .insert([{
          service_id: svc.id,
          category_id: item.categoryId
        }])

      if (linkErr) {
        throw new Error(`Failed to link category: ${linkErr.message}`)
      }

      // 3. Insert pricing
      const pricingPayload: any = {
        service_id: svc.id,
        currency: 'MUR',
        date_from: new Date().toISOString().split('T')[0],
        date_to: '2026-12-31',
        price_type: 'per_person',
        net_price: item.price
      }

      if (item.useOccupancyPricing) {
        pricingPayload.net_occupancy_pricing = { "2": { "price": item.price } }
      }

      const { error: pricingErr } = await supabase
        .from('service_pricing')
        .insert([pricingPayload])

      if (pricingErr) {
        throw new Error(`Failed to create pricing: ${pricingErr.message}`)
      }

      console.log(`   ✅ Successfully seeded. ID: ${svc.id}`)
    } catch (err: any) {
      console.error(`   ❌ Failed to seed "${item.name}":`, err.message)
    }
  }

  console.log('\nSeeding visual test items complete. Proceed to view on the web pages!')
}

run()
