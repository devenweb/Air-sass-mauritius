import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Initializes a Puppeteer browser instance with recommended settings
 */
export async function initBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: 'new', // Use 'new' for new headless implementation
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
    ],
  });
}

/**
 * Creates a new page with recommended settings
 */
export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  
  // Set a realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.155 Safari/537.36');
  
  // Set extra HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });
  
  // Set viewport
  await page.setViewport({ width: 1366, height: 768 });
  
  return page;
}

/**
 * Waits for a selector to appear and extracts text content
 */
export async function waitForAndExtractText(page: Page, selector: string): Promise<string> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return await page.$eval(selector, el => el.textContent?.trim() || '');
  } catch (error) {
    console.warn(`Selector ${selector} not found:`, error);
    return '';
  }
}

/**
 * Waits for a selector to appear and extracts attribute value
 */
export async function waitForAndExtractAttribute(page: Page, selector: string, attribute: string): Promise<string> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return await page.$eval(selector, el => el.getAttribute(attribute) || '');
  } catch (error) {
    console.warn(`Selector ${selector} not found:`, error);
    return '';
  }
}

/**
 * Safely extracts multiple elements' text content
 */
export async function extractMultipleText(page: Page, selector: string): Promise<string[]> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return await page.$$eval(selector, els => els.map(el => el.textContent?.trim() || ''));
  } catch (error) {
    console.warn(`Selector ${selector} not found:`, error);
    return [];
  }
}

/**
 * Safely extracts multiple elements' attribute values
 */
export async function extractMultipleAttributes(page: Page, selector: string, attribute: string): Promise<string[]> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return await page.$$eval(selector, els => els.map(el => el.getAttribute(attribute) || ''));
  } catch (error) {
    console.warn(`Selector ${selector} not found:`, error);
    return [];
  }
}

/**
 * Extracts structured data from elements using multiple selectors
 */
export async function extractStructuredData<T>(
  page: Page,
  containerSelector: string,
  extractors: { [K in keyof T]: (element: Element) => T[K] }
): Promise<T[]> {
  try {
    await page.waitForSelector(containerSelector, { timeout: 5000 });
    
    return await page.$$eval(containerSelector, (elements, extractors) => {
      return elements.map(element => {
        const result: any = {};
        Object.keys(extractors).forEach(key => {
          try {
            result[key] = (extractors as any)[key](element);
          } catch (e) {
            result[key] = null;
          }
        });
        return result;
      });
    }, extractors);
  } catch (error) {
    console.warn(`Container selector ${containerSelector} not found:`, error);
    return [];
  }
}

/**
 * Converts price text to number (handles formats like "Rs. 5,000", "$100", etc.)
 */
export function parsePrice(priceText: string): number {
  if (!priceText) return 0;
  
  // Remove currency symbols and commas, extract numbers
  const priceMatch = priceText.match(/[\d,.-]+/);
  if (priceMatch) {
    return parseFloat(priceMatch[0].replace(/,/g, ''));
  }
  return 0;
}

/**
 * Normalizes location data to standard regions
 */
export function normalizeRegion(location: string): string {
  const loc = location.toLowerCase();
  
  if (loc.includes('grand baie') || loc.includes('trinity') || loc.includes('anse') || 
      loc.includes('la colline') || loc.includes('pamplemousses')) {
    return 'North';
  }
  if (loc.includes('flic en flac') || loc.includes('tamarin') || loc.includes('black river') ||
      loc.includes('chamouny') || loc.includes('cascade')) {
    return 'West';
  }
  if (loc.includes('trou aux biches') || loc.includes('mon choisy') || loc.includes('pointe aux cannoniers') ||
      loc.includes('mapou') || loc.includes('grande baye')) {
    return 'North';
  }
  if (loc.includes('bel ombre') || loc.includes('flic en flac') || loc.includes('grand gaube') ||
      loc.includes('poste de flacq') || loc.includes('saint jean')) {
    return 'East';
  }
  if (loc.includes('surinam') || loc.includes('roches noires') || loc.includes('cap malheureux') ||
      loc.includes('cité la cure') || loc.includes('quatre cocos')) {
    return 'North';
  }
  if (loc.includes('souillac') || loc.includes('mahebourg') || loc.includes('riemer') ||
      loc.includes('petit riemer') || loc.includes('plaine magnien')) {
    return 'South';
  }
  
  return 'Mauritius'; // Default
}

/**
 * Sleep function to pause execution
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}