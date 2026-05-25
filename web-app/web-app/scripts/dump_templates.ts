import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTemplates() {
    const { data: templates, error } = await supabase
        .from('email_templates')
        .select('*')
        .in('name', ['booking_confirmation', 'admin_new_booking']);

    if (error) {
        console.error('Error fetching templates:', error);
        return;
    }

    console.log('--- Target Email Templates ---');
    templates?.forEach(t => {
        console.log(`\nName: ${t.name}`);
        console.log(`Subject: ${t.subject}`);
        console.log(`Body:`);
        console.log(t.body);
    });
    
    if (!templates || templates.length === 0) {
        console.log('No templates found with those names.');
        // List all names
        const { data: all } = await supabase.from('email_templates').select('name');
        console.log('Available names:', all?.map(a => a.name));
    }
}

findTemplates();
