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
	signup: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		if (!email || !password || !confirmPassword) {
			return fail(400, { message: 'Todos os campos são obrigatórios' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'As senhas não coincidem' });
		}

		if (password.length < 6) {
			return fail(400, { message: 'A senha deve ter no mínimo 6 caracteres' });
		}

		const { error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, {
				message: error.message === 'User already registered' 
					? 'Este email já está cadastrado' 
					: 'Erro ao criar conta. Tente novamente.'
			});
		}

		throw redirect(303, '/');
	},

	google: async ({ locals, url }) => {
		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, { message: 'Erro ao cadastrar com Google' });
		}

		if (data.url) {
			throw redirect(303, data.url);
		}
	}
};

