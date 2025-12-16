import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';
import type { Database } from '$lib/types/database.types';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				get(name) {
					const value = event.cookies.get(name);
					console.log('[SSO LocaList] Getting cookie:', name, '=', value ? 'EXISTS' : 'NOT FOUND');
					return value;
				},
				set(name, value, options) {
					console.log('[SSO LocaList] Setting cookie:', name, 'with domain:', '.monsan.duckdns.org');
					event.cookies.set(name, value, {
						...options,
						path: '/',
						domain: '.monsan.duckdns.org',
						secure: true,
						httpOnly: true,
						sameSite: 'lax'
					});
				},
				remove(name, options) {
					console.log('[SSO LocaList] Removing cookie:', name);
					event.cookies.delete(name, {
						...options,
						path: '/',
						domain: '.monsan.duckdns.org'
					});
				}
			}
		}
	);

	event.locals.getSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};

