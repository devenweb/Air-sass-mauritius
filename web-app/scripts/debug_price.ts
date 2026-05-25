import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    const { data: services, error } = await supabase
        .from('services')
        .select('id, name, service_type')
        .ilike('name', '%dolphin%');

    if (error) {
        console.error('Error fetching services:', error);
        return;
    }

    console.log('--- Services Found ---');
    console.table(services);

    if (services && services.length > 0) {
        const serviceId = services[0].id;
        
        const { data: pricing, error: pError } = await supabase
            .from('service_pricing')
            .select('*')
            .eq('service_id', serviceId);

        if (pError) {
            console.error('Error fetching pricing:', pError);
            return;
        }

        console.log('\n--- Pricing Records ---');
        console.table(pricing?.map(p => ({
            id: p.id,
            date_from: p.date_from,
            date_to: p.date_to,
            price: p.price,
            price_teen: p.price_teen,
            price_child: p.price_child,
            price_infant: p.price_infant,
            price_type: p.price_type,
            variant_id: p.variant_id,
            occupancy_pricing: JSON.stringify(p.occupancy_pricing)
        })));
    }
}

debug();
