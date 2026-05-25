const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/deven/Desktop/web-app/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const generalConfig = {
  siteTitle: "Royal Travel Agency",
  siteTagline: "Your local and international holiday provider",
  contactEmail: "reservation@travellounge.mu",
  contactPhone: "(+230) 212 4070",
  whatsappNumber1: "+230 5509 7702",
  whatsappNumber2: "+230 5940 7711",
  office1Title: "Port Louis Office",
  office1Address: "Ground Floor Newton Tower, Corner Sir William Newton and Remy Ollier Street, Port Louis, Mauritius",
  office2Title: "Ebene Office",
  office2Address: "Ground Floor, 57 Ebene Mews, Rue Du Savoir, Ebene Cybercity.",
  office1MapUrl: "https://www.google.com/maps/search/?api=1&query=Newton+Tower+Port+Louis",
  office2MapUrl: "https://www.google.com/maps/search/?api=1&query=Ebene+Mews+Cybercity",
  workingHours: "Monday – Friday: 08:30 – 16:45\nSaturday: 08:30 – 12:30\nSunday & Public holidays: Closed",
  facebookUrl: "https://www.facebook.com/travellounge.mu/",
  instagramUrl: "https://www.instagram.com/travellounge/",
  linkedinUrl: "",
  showFooterWeb: true,
  showFooterMobile: true,
  logoUrl: "/assets/logo-red-bird.png",
  logoHeight: "80",
  logoWidth: "auto",
  navbarCtaLabel: "Plan My Trip",
  navbarCtaHref: "/contact",
  ui_labels: {
    footer_tagline: "At Royal Travel Agency, we give you the freedom to either create tailor-made trips with our agents or book your next hotel in Mauritius online in few clicks ! Enjoy safe, secure and memorable holidays with the assistance of our IATA accredited travel agents.",
    visit_us: "Visit Us",
    contact_us: "Contact Us",
    working_hours: "Working Hours",
    quick_links: "Quick Links",
    newsletter: "Newsletter",
    go_btn: "Go",
    directions_btn: "Directions",
    subscribe_success: "Thank you for subscribing!",
    subscribe_error: "Failed to subscribe. Please try again.",
    already_subscribed: "You are already subscribed!",
    menu_btn: "Menu",
    close_btn: "Close"
  },
  form_placeholders: {
    email_address: "Enter your email"
  }
};

async function syncSettings() {
    console.log('Syncing comprehensive site settings...');
    
    // 1. Sync general_config
    const { error: genError } = await supabase
        .from('site_settings')
        .upsert({
            key: 'general_config',
            value: generalConfig,
            category: 'general',
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (genError) console.error('Error syncing general_config:', genError);
    else console.log('general_config synced!');

    // 2. Sync seo_config (using site title)
    const seoConfig = {
        metaTitle: "Royal Travel Agency | Your Premiere Holiday Provider",
        metaDescription: "Discover amazing hotels, cruises, tours, and travel experiences worldwide. Your local and international holiday provider in Mauritius.",
        metaKeywords: "travel, mauritius, holidays, hotels, cruises, tours",
        ogImage: "/assets/promo-banner.png"
    };

    const { error: seoError } = await supabase
        .from('site_settings')
        .upsert({
            key: 'seo_config',
            value: seoConfig,
            category: 'seo',
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (seoError) console.error('Error syncing seo_config:', seoError);
    else console.log('seo_config synced!');
}

syncSettings();
