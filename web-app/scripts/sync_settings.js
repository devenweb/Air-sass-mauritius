const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'c:/Users/deven/Desktop/web-app/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const generalConfig = {
  siteTitle: "Royal Travel Agency",
  contactEmail: "reservation@royaltravel.mu",
  contactPhone: "(+230) 212 4070",
  whatsappNumber1: "+230 5509 7702",
  whatsappNumber2: "+230 5940 7711",
  office1Title: "Port Louis Office",
  office1Address: "Ground Floor Newton Tower, Corner Sir William Newton and Remy Ollier Street, Port Louis, Mauritius",
  office2Title: "Ebene Office",
  office2Address: "Ground Floor, 57 Ebene Mews, Rue Du Savoir, Ebene Cybercity.",
  workingHours: "Mon - Fri: 08:30 - 16:45\nSat: 08:30 - 12:30\nSun & Public Holidays: Closed",
  facebookUrl: "https://www.facebook.com/royaltravel.mu/",
  instagramUrl: "https://www.instagram.com/royaltravel/",
  showFooterWeb: true,
  showFooterMobile: true,
  logoUrl: "/assets/logo-red-bird.png",
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
    already_subscribed: "You are already subscribed!"
  }
};

async function syncSettings() {
    console.log('Syncing site settings...');
    
    const { error } = await supabase
        .from('site_settings')
        .upsert({
            key: 'general_config',
            value: generalConfig,
            category: 'general'
        }, { onConflict: 'key' });

    if (error) {
        console.error('Error syncing settings:', error);
    } else {
        console.log('Settings synced successfully!');
    }
}

syncSettings();
