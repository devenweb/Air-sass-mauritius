import { createBrowserClient } from '@supabase/ssr'

/* OLD IMPLEMENTATION - COMMENTED OUT TO ENSURE NO REGRESSIONS AND PRESERVE HISTORY
export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

    return createBrowserClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        }
    })
}
*/

let hasWarned = false;

const makeChain = () => {
    const chain: any = {
        select: () => chain,
        insert: () => chain,
        update: () => chain,
        delete: () => chain,
        eq: () => chain,
        neq: () => chain,
        gt: () => chain,
        lt: () => chain,
        gte: () => chain,
        lte: () => chain,
        like: () => chain,
        ilike: () => chain,
        is: () => chain,
        in: () => chain,
        contains: () => chain,
        containedBy: () => chain,
        range: () => chain,
        order: () => chain,
        limit: () => chain,
        single: () => chain,
        maybeSingle: () => chain,
        csv: () => chain,
        // Promise/thenable standard interface
        then: (onFulfilled?: (value: any) => any) => {
            const res = { data: null, error: null };
            if (typeof onFulfilled === 'function') {
                return Promise.resolve(onFulfilled(res));
            }
            return Promise.resolve(res);
        },
        catch: (onRejected?: (reason: any) => any) => {
            if (typeof onRejected === 'function') {
                return Promise.resolve(onRejected(null));
            }
            return Promise.resolve(null);
        },
        finally: (onFinally?: () => void) => {
            if (typeof onFinally === 'function') {
                onFinally();
            }
            return chain;
        }
    };
    return chain;
};

const dummyClient = {
    auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: null, error: null }),
            download: () => Promise.resolve({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: '' } }),
        })
    },
    from: () => makeChain(),
} as any;

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        if (!hasWarned) {
            console.warn('Supabase environment variables are missing. Using mock client for build/pre-rendering.');
            hasWarned = true;
        }
        return dummyClient;
    }

    return createBrowserClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        }
    })
}
