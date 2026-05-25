import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Let the client know if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('CRITICAL: Supabase environment variables are missing! Check your .env setup.');
}

// Initializing the Supabase client with auth minimized as per user request
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
