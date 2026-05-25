import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string | null;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: any[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: string;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  default_attributes: any[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: any[];
}

/**
 * Fetch all products from WooCommerce
 */
async function fetchWooCommerceProducts(wooSiteUrl: string, consumerKey: string, consumerSecret: string): Promise<WooCommerceProduct[]> {
  const products: WooCommerceProduct[] = [];
  let page = 1;
  
  try {
    while (true) {
      const response = await axios.get(`${wooSiteUrl}/wp-json/wc/v3/products`, {
        params: {
          per_page: 100,
          page: page,
          consumer_key: consumerKey,
          consumer_secret: consumerSecret
        },
        headers: {
          'User-Agent': 'DataMigrationBot/1.0'
        }
      });
      
      if (response.data.length === 0) {
        break;
      }
      
      products.push(...response.data);
      page++;
      
      // Be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Insert products into Supabase
 */
async function insertProductsIntoSupabase(products: WooCommerceProduct[]) {
  for (const product of products) {
    // Example mapping - adjust according to your Supabase table structure
    const { data, error } = await supabase
      .from('packages') // Adjust table name to match your schema (could be 'products', 'tours', 'activities', etc.)
      .insert({
        title: product.name,
        slug: product.slug,
        description: product.description,
        short_description: product.short_description,
        price: parseFloat(product.price),
        regular_price: parseFloat(product.regular_price),
        sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
        status: product.status,
        stock_quantity: product.stock_quantity,
        sku: product.sku,
        images: product.images.map(img => img.src),
        categories: product.categories.map(cat => cat.name),
        tags: product.tags.map(tag => tag.name),
        created_at: product.date_created,
        updated_at: product.date_modified,
        featured: product.featured
      });

    if (error) {
      console.error(`Error inserting product ${product.id}:`, error);
    } else {
      console.log(`Successfully inserted product ${product.id}: ${product.name}`);
    }
  }
}

/**
 * Main WooCommerce migration function
 */
async function migrateWooCommerceData() {
  const wooSiteUrl = process.env.WORDPRESS_SITE_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;
  
  if (!wooSiteUrl || !consumerKey || !consumerSecret) {
    console.error('Missing required environment variables: WORDPRESS_SITE_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET');
    return;
  }

  console.log('Starting WooCommerce data migration...');
  
  try {
    console.log('Fetching products...');
    const products = await fetchWooCommerceProducts(wooSiteUrl, consumerKey, consumerSecret);
    console.log(`Fetched ${products.length} products`);
    
    console.log('Inserting products into Supabase...');
    await insertProductsIntoSupabase(products);
    
    console.log('WooCommerce migration completed!');
  } catch (error) {
    console.error('WooCommerce migration failed:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateWooCommerceData();
}

export { 
  fetchWooCommerceProducts, 
  insertProductsIntoSupabase, 
  migrateWooCommerceData 
};