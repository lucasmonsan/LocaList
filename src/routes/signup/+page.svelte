<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import { toast } from '$lib/components/toast/toast.svelte';
	import { fade } from 'svelte/transition';

	let { form } = $props();

	let loading = $state(false);
	let t = $derived(i18n.t);

	$effect(() => {
		if (form?.message) {
			toast.error(form.message);
		}
	});
</script>

<div class="container" transition:fade>
	<div class="card">
		{#if t && t.auth}
			<h1>{t.auth.signupTitle}</h1>

			<form
				method="POST"
				action="?/signup"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<div class="field">
					<label for="email">{t.auth.emailLabel}</label>
					<input type="email" id="email" name="email" required />
				</div>

				<div class="field">
					<label for="password">{t.auth.passwordLabel}</label>
					<input type="password" id="password" name="password" required minlength="6" />
				</div>

				<div class="field">
					<label for="confirmPassword">Confirmar Senha</label>
					<input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" />
				</div>

				<Button type="submit" disabled={loading} style="width: 100%; justify-content: center;">
					{loading ? '...' : t.auth.signupButton}
				</Button>
			</form>

			<div class="divider">
				<span>{t.auth.or}</span>
			</div>

			<form method="POST" action="?/google">
				<Button type="submit" style="width: 100%; justify-content: center;">
					{t.auth.googleLogin}
				</Button>
			</form>

			<p>
				<a href="/login">{t.auth.hasAccount}</a>
			</p>
		{:else}
			<p>Carregando...</p>
		{/if}
	</div>
</div>

<style>
	div {
		&.container {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100dvh;
			padding: var(--md);
			background: var(--bg);
			border: solid;
		}

		&.card {
			width: 100%;
			max-width: 400px;
			background: var(--surface);
			padding: var(--xl);
			border-radius: var(--radius-out);
			box-shadow: var(--shadow-lg);
			display: flex;
			flex-direction: column;
			gap: var(--md);
		}

		&.field {
			display: flex;
			flex-direction: column;
			gap: var(--xxs);
		}

		&.divider {
			display: flex;
			flex-direction: row;
			align-items: center;
			color: var(--text-secondary);
			font-size: var(--sm);

			&::before,
			&::after {
				content: '';
				flex: 1;
				border-bottom: 2px solid var(--border-color);
			}
		}
	}

	span {
		padding: 0 var(--xs);
	}

	h1 {
		text-align: center;
		font-size: var(--xxl);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--md);
	}

	label {
		font-size: var(--sm);
		font-weight: 600;
		color: var(--text-secondary);
	}

	input {
		padding: var(--sm);
		border: 2px solid var(--border-color);
		border-radius: var(--radius-in);
		font-size: var(--md);
		color: var(--text-primary);
		background: var(--bg);
		transition: border-color var(--fast);

		&:focus {
			border-color: var(--brand-primary);
		}
	}

	p {
		text-align: center;
		margin: 0;
	}

	a {
		font-size: var(--sm);
	}
</style>
