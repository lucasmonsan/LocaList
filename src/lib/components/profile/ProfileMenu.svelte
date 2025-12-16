<script lang="ts">
	import { slideUp } from '$lib/utils/transitions';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import { themeState } from '$lib/stores/theme.svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import type { Locale } from '$lib/i18n/types';
	import SunIcon from '$lib/icons/SunIcon.svelte';
	import MoonIcon from '$lib/icons/MoonIcon.svelte';
	import LanguageIcon from '$lib/icons/LanguageIcon.svelte';
	import StarIcon from '$lib/icons/StarIcon.svelte';
	import ReviewsIcon from '$lib/icons/ReviewsIcon.svelte';
	import KeyIcon from '$lib/icons/KeyIcon.svelte';
	import TrashIcon from '$lib/icons/TrashIcon.svelte';
	import InfoIcon from '$lib/icons/InfoIcon.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let themeExpanded = $state(false);
	let languageExpanded = $state(false);

	const themes = [
		{ value: 'light', icon: SunIcon },
		{ value: 'auto', icon: SunIcon },
		{ value: 'dark', icon: MoonIcon }
	];

	const languages: { value: Locale; label: string; flag: string }[] = [
		{ value: 'pt-BR', label: 'Português', flag: '🇧🇷' },
		{ value: 'en-US', label: 'English', flag: '🇺🇸' }
	];

	function toggleTheme() {
		themeExpanded = !themeExpanded;
		if (themeExpanded) languageExpanded = false;
	}

	function toggleLanguage() {
		languageExpanded = !languageExpanded;
		if (languageExpanded) themeExpanded = false;
	}

	function handleThemeSelect(value: string) {
		themeState.set(value);
		themeExpanded = false;
	}

	function handleLanguageSelect(value: Locale) {
		i18n.setLocale(value);
		languageExpanded = false;
	}

	function getThemeLabel(theme: string): string {
		if (theme === 'light') return i18n.t.profile.theme.light;
		if (theme === 'dark') return i18n.t.profile.theme.dark;
		return i18n.t.profile.theme.auto;
	}

	function getLanguageLabel(locale: Locale): string {
		const lang = languages.find((l) => l.value === locale);
		return lang ? lang.label : 'Português';
	}

	function getThemeIcon() {
		const theme = themeState.value;
		if (theme === 'light') return SunIcon;
		if (theme === 'dark') return MoonIcon;
		return SunIcon;
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
	<div class="profile-menu shadow" transition:slideUp>
		<section>
			<button class="collapsible" onclick={toggleTheme} aria-expanded={themeExpanded}>
				<span class="collapsible-content">
				<span class="icon-wrapper">
					<svelte:component this={getThemeIcon()} />
				</span>
				{i18n.t.profile.theme.title}: <strong>{getThemeLabel(themeState.value)}</strong>
				</span>
				<span class="arrow" class:expanded={themeExpanded}>▼</span>
			</button>

			{#if themeExpanded}
				<div class="options" transition:slideUp={{ duration: 200 }}>
					{#each themes as theme}
					<button class="option" class:active={themeState.value === theme.value} onclick={() => handleThemeSelect(theme.value)}>
						<span class="icon-wrapper small">
							<svelte:component this={theme.icon} />
						</span>
							{getThemeLabel(theme.value)}
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<section>
			<button class="collapsible" onclick={toggleLanguage} aria-expanded={languageExpanded}>
				<span class="collapsible-content">
					<span class="icon-wrapper">
						<LanguageIcon />
					</span>
					{i18n.t.profile.language.title}: <strong>{getLanguageLabel(i18n.locale)}</strong>
				</span>
				<span class="arrow" class:expanded={languageExpanded}>▼</span>
			</button>

			{#if languageExpanded}
				<div class="options" transition:slideUp={{ duration: 200 }}>
					{#each languages as lang}
						<button class="option" class:active={i18n.locale === lang.value} onclick={() => handleLanguageSelect(lang.value)}>
							{lang.flag}
							{lang.label}
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<div class="separator"></div>

		<section class="links">
			<a href="/favorites">
				<span class="icon-wrapper small">
					<StarIcon />
				</span>
				{i18n.t.profile.favorites}
			</a>
			<a href="/reviews">
				<span class="icon-wrapper small">
					<ReviewsIcon />
				</span>
				{i18n.t.profile.reviews}
			</a>
			<a href="https://github.com/lucasmonsan/localista" target="_blank" rel="noopener noreferrer">
				<span class="icon-wrapper small">
					<InfoIcon />
				</span>
				{i18n.t.profile.about}
			</a>
		</section>

		<div class="separator"></div>

		<section class="action">
			{#if authState.user}
				<div class="user-info">
					<small>{authState.user.email}</small>
				</div>
				<button class="logout" onclick={() => authState.signOut()}>
					<span class="icon-wrapper small">
						<TrashIcon />
					</span>
					{i18n.t.profile.logout}
				</button>
		{:else}
			<a href="https://monsan.duckdns.org/login?redirect=https://map.monsan.duckdns.org" class="login-link">
				<button class="login">
					<span class="icon-wrapper small">
						<KeyIcon />
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
		margin-bottom: var(--xxs);
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

	.collapsible {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--xxs) var(--xs);
		background: transparent;
		border: none;
		border-radius: var(--radius-in);
		cursor: pointer;
		font-size: var(--sm);
		font-weight: 600;
		color: var(--text-primary);
		transition: background var(--fast);
		text-align: left;

		&:hover {
			background: var(--bg);
		}
	}

	.collapsible-content {
		display: flex;
		align-items: center;
		gap: var(--xxs);
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

	.arrow {
		font-size: var(--xs);
		transition: transform var(--fast);
		color: var(--text-secondary);

		&.expanded {
			transform: rotate(180deg);
		}
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: var(--xxxs);
		padding-left: var(--xs);
	}

	.option {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--xxs);
		padding: var(--xxs) var(--xs);
		text-align: left;
		background: transparent;
		border: none;
		border-radius: var(--radius-in);
		cursor: pointer;
		font-size: var(--sm);
		font-weight: 500;
		color: var(--text-primary);
		transition: background var(--fast);

		&:hover {
			background: var(--bg);
		}

		&.active {
			background: var(--brand-primary);
			color: var(--surface);
			font-weight: 600;
		}

		&.active .icon-wrapper {
			color: var(--surface);
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
		color: var(--surface);

		&:hover {
			background: var(--brand-secondary);
		}
	}

	.login .icon-wrapper {
		color: var(--surface);
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

	.user-info {
		padding: 0 var(--xs);
		margin-bottom: var(--xxs);
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
