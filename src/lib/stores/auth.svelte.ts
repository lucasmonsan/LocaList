import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';

class AuthState {
	session = $state<Session | null>(null);
	user = $state<User | null>(null);
	loading = $state(true);
	private supabase: SupabaseClient | null = null;

	init(supabase: SupabaseClient, session: Session | null) {
		this.supabase = supabase;
		this.setSession(session);

		if (browser) {
			supabase.auth.onAuthStateChange((_event, session) => {
				this.setSession(session);
				invalidate('supabase:auth');
			});
		}

		this.loading = false;
	}

	private setSession(session: Session | null) {
		this.session = session;
		this.user = session?.user ?? null;
	}

	async signOut() {
		if (this.supabase) {
			await this.supabase.auth.signOut();
		}
		this.session = null;
		this.user = null;
	}
}

export const authState = new AuthState();