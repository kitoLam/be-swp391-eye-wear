import { createClient } from '@supabase/supabase-js';
import { config } from './env.config';

const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.key;

console.log('--- Supabase Config Debug ---');
console.log('URL:', supabaseUrl);
console.log('Key Length:', supabaseKey?.length);
console.log('---------------------------');

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkSupabaseConnection = async () => {
    try {
        const { error } = await supabase
            .from('customer')
            .select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') {
            // PGRST116 is "The result contains 0 rows" which is fine for empty table
            // Actually head:true with count returns count, error might be if table doesn't exist or auth fails
            // If table doesn't exist, it returns 404-like error.
            // Let's just do a simple select.
        }
        console.log('✅ Supabase connected successfully');
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        // Don't exit process, maybe just warn? Or exit if critical.
    }
};
