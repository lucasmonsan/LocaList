import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();

	if (session) {
		throw redirect(303, '/');
	}

	return {};
};

export const actions: Actions = {
	login: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { message: 'Email e senha são obrigatórios' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return fail(400, {
				message: error.message === 'Invalid login credentials' 
					? 'Email ou senha inválidos' 
					: 'Erro ao fazer login. Tente novamente.'
			});
		}

		const redirectTo = url.searchParams.get('redirect') || '/';
		throw redirect(303, redirectTo);
	},

	google: async ({ locals, url }) => {
		const redirectTo = url.searchParams.get('redirect') || '/';
		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${url.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
			}
		});

		if (error) {
			return fail(400, { message: 'Erro ao fazer login com Google' });
		}

		if (data.url) {
			throw redirect(303, data.url);
		}
	}
};

