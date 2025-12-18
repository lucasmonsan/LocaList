<script lang="ts">
	import { slideUp } from '$lib/utils/transitions';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import { themeState } from '$lib/stores/theme.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import type { Locale } from '$lib/i18n/types';
	import { Sun, Moon, SunMoon, Languages, Star, MessageSquare, Key, LogOut, Info } from 'lucide-svelte';
	import { haptics } from '$lib/utils/haptics';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	const themes = [
		{ value: 'light', icon: Sun, label: i18n.t.profile.theme.light },
		{ value: 'dark', icon: Moon, label: i18n.t.profile.theme.dark }
	];

	const languages: { value: Locale; label: string; flag: string }[] = [
		{ value: 'pt-BR', label: 'Português', flag: '🇧🇷' },
		{ value: 'en-US', label: 'English', flag: '🇺🇸' }
	];

	function handleThemeSelect(value: string) {
		haptics.light();
		themeState.set(value);
	}

	function handleLanguageSelect(value: Locale) {
		haptics.light();
		i18n.setLocale(value);
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.profile-menu') && !target.closest('[aria-label*="erfil"]')) {
			onClose();
		}
	}

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	$effect(() => {
		if (isOpen) {
			setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
				document.addEventListener('keydown', handleEscape);
			}, 10);
			return () => {
				document.removeEventListener('click', handleClickOutside);
				document.removeEventListener('keydown', handleEscape);
			};
		}
	});
</script>

{#if isOpen}
	<div class="profile-menu shadow" transition:slideUp role="menu">
		<section class="settings-row">
			<div class="section-label" id="theme-label">{i18n.t.profile.theme.title}</div>
			<div class="theme-toggle" role="radiogroup" aria-labelledby="theme-label">
				{#each themes as theme}
					{@const Icon = theme.icon}
					<button
						class="theme-button"
						class:active={themeState.value === theme.value}
						onclick={() => handleThemeSelect(theme.value)}
						role="radio"
						aria-checked={themeState.value === theme.value}
						aria-label={theme.label}
					>
						<Icon size={18} />
					</button>
				{/each}
			</div>
		</section>

		<section class="settings-row">
			<div class="section-label" id="language-label">{i18n.t.profile.language.title}</div>
			<div class="language-toggle" role="radiogroup" aria-labelledby="language-label">
				{#each languages as lang}
					<button
						class="language-button"
						class:active={i18n.locale === lang.value}
						onclick={() => handleLanguageSelect(lang.value)}
						role="radio"
						aria-checked={i18n.locale === lang.value}
						aria-label={lang.label}
					>
						{lang.flag}
					</button>
				{/each}
			</div>
		</section>

		<div class="separator"></div>

		<section class="links">
			<a href="/favorites">
				<span class="icon-wrapper small">
					<Star size={16} />
				</span>
				{i18n.t.profile.favorites}
			</a>
			<a href="/reviews">
				<span class="icon-wrapper small">
					<MessageSquare size={16} />
				</span>
				{i18n.t.profile.reviews}
			</a>
			<a href="https://github.com/lucasmonsan/localista" target="_blank" rel="noopener noreferrer">
				<span class="icon-wrapper small">
					<Info size={16} />
				</span>
				{i18n.t.profile.about}
			</a>
		</section>

		<div class="separator"></div>

		<section class="action">
			{#if authState.user}
				<div class="user-action">
					<small class="user-email">{authState.user.email}</small>
					<button class="logout" onclick={() => authState.signOut()} aria-label={i18n.t.profile.logout}>
						<span class="icon-wrapper small">
							<LogOut size={16} />
						</span>
						{i18n.t.profile.logout}
					</button>
				</div>
			{:else}
				<a
					href={`https://monsan.duckdns.org/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'https://map.monsan.duckdns.org')}`}
					class="login-link"
				>
					<button class="login">
						<span class="icon-wrapper small">
							<Key size={16} />
						</span>
						{i18n.t.profile.login}
					</button>
				</a>
			{/if}
		</section>
	</div>
{/if}

<style>
	.profile-menu {
		width: 100%;
		background: var(--surface);
		border-radius: var(--radius-out);
		padding: var(--xs);
		display: flex;
		flex-direction: column;
		gap: var(--xs);
	}

	.shadow {
		box-shadow: var(--shadow-lg);
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--xxxs);
	}

	.settings-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: var(--sm);
		padding: 0 var(--xs);
	}

	.section-label {
		flex-shrink: 0;
		font-size: var(--xs);
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0;
	}

	.theme-toggle,
	.language-toggle {
		display: flex;
		gap: var(--xxs);
		background: transparent;
		border-radius: var(--radius-md);
		padding: 2px;
	}

	.theme-button,
	.language-button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--xxs);
		padding: var(--xxs) var(--xs);
		background: transparent;
		border: none;
		border-radius: var(--radius-in);
		cursor: pointer;
		font-size: var(--sm);
		font-weight: 500;
		color: var(--text-secondary);
		transition: all 200ms cubic-bezier(0.34, 1.56, 0.64, 1);

		&:hover:not(.active) {
			background: color-mix(in srgb, var(--text-primary) 5%, transparent);
		}

		&.active {
			background: var(--brand-primary);
			color: var(--surface);
			font-weight: 600;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}
	}

	.icon-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--lg);
		height: var(--lg);
		color: var(--text-secondary);

		&.small {
			width: var(--md);
			height: var(--md);
		}
	}

	.separator {
		height: 1px;
		background: var(--border-color);
	}

	.links {
		gap: var(--xxxs);
	}

	.links a {
		display: flex;
		align-items: center;
		gap: var(--xxs);
		padding: var(--xxs) var(--xs);
		font-size: var(--sm);
		font-weight: 600;
		color: var(--text-primary);
		text-decoration: none;
		border-radius: var(--radius-in);
		transition: background var(--fast);

		&:hover {
			background: var(--bg);
		}
	}

	.action {
		margin: 0;
	}

	.login-link {
		text-decoration: none;
	}

	.login,
	.logout {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--xxs);
		padding: var(--xxs) var(--xs);
		font-size: var(--sm);
		font-weight: 600;
		border: none;
		border-radius: var(--radius-in);
		cursor: pointer;
		transition: all var(--fast);
	}

	.login {
		background: var(--brand-primary);
		color: #fff;

		&:hover {
			background: var(--brand-secondary);
		}
	}

	.login .icon-wrapper {
		color: #fff;
	}

	.logout {
		background: transparent;
		color: var(--error);

		&:hover {
			background: var(--bg);
		}
	}

	.logout .icon-wrapper {
		color: var(--error);
	}

	.user-action {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--xs);
		padding: var(--xxs) var(--xs);
	}

	.user-email {
		flex: 1;
		font-size: var(--sm);
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
