import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

const PAGES = [
  { name: 'flights', url: 'http://localhost:3000/flights', expectedText: '_TEST_VISUAL_FLIGHT' },
  { name: 'hotels', url: 'http://localhost:3000/hotels', expectedText: '_TEST_VISUAL_HOTEL' },
  { name: 'activities', url: 'http://localhost:3000/activities', expectedText: '_TEST_VISUAL_ACTIVITY' },
  { name: 'travel_packages', url: 'http://localhost:3000/travel-packages', expectedText: '_TEST_VISUAL_TRAVEL_PACKAGE' },
  { name: 'cruises', url: 'http://localhost:3000/cruises', expectedText: '_TEST_VISUAL_CRUISE' },
  { name: 'tours', url: 'http://localhost:3000/tours', expectedText: '_TEST_VISUAL_GROUP_TOUR' },
  { name: 'guided_group_tours', url: 'http://localhost:3000/guided-group-tours', expectedText: '_TEST_VISUAL_GROUP_TOUR' },
  { name: 'rodrigues', url: 'http://localhost:3000/destinations/rodrigues', expectedText: '_TEST_VISUAL_RODRIGUES' },
  { name: 'day_packages', url: 'http://localhost:3000/day-packages', expectedText: '_TEST_VISUAL_DAY_PACKAGE' },
  { name: 'mauritius', url: 'http://localhost:3000/destinations/mauritius', expectedText: '_TEST_VISUAL_MAURITIUS' },
  { name: 'evening_packages', url: 'http://localhost:3000/evening-packages', expectedText: '_TEST_VISUAL_EVENING_PACKAGE' }
]

async function run() {
  console.log('========================================================================')
  console.log('📸 STARTING PUPPETEER FRONTEND VISUAL VERIFICATION')
  console.log('========================================================================\n')

  const tempDir = 'C:\\Users\\deven\\AppData\\Local\\Temp'
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  for (const page of PAGES) {
    try {
      console.log(`[NAVIGATE] Going to ${page.url}...`)
      const tab = await browser.newPage()
      await tab.setViewport({ width: 1280, height: 800 })
      
      // Navigate and wait until network is idle or 30 seconds
      await tab.goto(page.url, { waitUntil: 'networkidle2', timeout: 30000 })
      
      // Wait extra 3 seconds for client-side queries to resolve
      await new Promise(resolve => setTimeout(resolve, 3000))

      const bodyText = await tab.evaluate(() => document.body.innerText)
      const isPresent = bodyText.includes(page.expectedText)

      const screenshotPath = path.join(tempDir, `${page.name}_page.png`)
      await tab.screenshot({ path: screenshotPath, fullPage: false })

      if (isPresent) {
        console.log(`   ✅ SUCCESS: Found "${page.expectedText}" on ${page.name} page.`)
        console.log(`   📸 Saved screenshot to: ${screenshotPath}`)
      } else {
        console.warn(`   ❌ WARNING: "${page.expectedText}" NOT found on ${page.name} page in text content.`)
        console.log(`   📸 Saved debug screenshot to: ${screenshotPath}`)
      }
      
      await tab.close()
    } catch (err: any) {
      console.error(`   ❌ Failed to verify page ${page.name}:`, err.message)
    }
  }

  await browser.close()
  console.log('\nVerification complete.')
}

run()
