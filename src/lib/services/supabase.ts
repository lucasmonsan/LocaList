import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	console.error('Supabase environment variables are not set.');
}

export const createSupabaseClient = () => {
	return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
};

export const createSupabaseServerClient = (cookieStore: {
	get: (name: string) => string | undefined;
	set: (name: string, value: string, options: any) => void;
	remove: (name: string, options: any) => void;
}) => {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get(name) {
				return cookieStore.get(name);
			},
			set(name, value, options) {
				cookieStore.set(name, value, { ...options, path: '/' });
			},
			remove(name, options) {
				cookieStore.remove(name, { ...options, path: '/' });
			}
		}
	});
};