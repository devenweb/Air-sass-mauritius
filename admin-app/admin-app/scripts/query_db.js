import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('content_blocks')
    .select('*')
    .or('page_slug.eq.team,page_slug.eq.about/team');
  
  if (error) {
    console.error("Error querying content_blocks:", error);
  } else {
    console.log("Blocks found:", JSON.stringify(data, null, 2));
  }
}

run();
