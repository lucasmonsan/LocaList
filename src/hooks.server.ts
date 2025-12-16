import { createSupabaseServerClient } from '$lib/services/supabase';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient({
		get: (name) => event.cookies.get(name),
		set: (name, value, options) => {
			event.cookies.set(name, value, {
				...options,
				path: '/',
				domain: '.monsan.duckdns.org',
				secure: true,
				httpOnly: true,
				sameSite: 'lax'
			});
		},
		remove: (name, options) => {
			event.cookies.delete(name, {
				...options,
				path: '/',
				domain: '.monsan.duckdns.org'
			});
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session },
			error
		} = await event.locals.supabase.auth.getSession();

		if (error) {
			return { session: null, user: null };
		}

		return {
			session,
			user: session?.user ?? null
		};
	};

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

