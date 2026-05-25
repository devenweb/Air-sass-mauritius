import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTeamLink() {
    console.log('Updating Team link to /about/team...');
    
    const { data, error } = await supabase
        .from('navigations')
        .update({ link: '/about/team' })
        .eq('id', 'a9f0d4ac-f7e1-4afa-8c6b-8c8750c6823f')
        .select();

    if (error) {
        console.error('Error updating:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Success! Updated navigation:', data[0].label, 'to', data[0].link);
    } else {
        console.log('No record found with that ID.');
    }
}

fixTeamLink();
