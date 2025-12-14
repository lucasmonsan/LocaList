<script lang="ts">
	import { slide } from 'svelte/transition';
	import { i18n } from '$lib/i18n/index.svelte';
	import type { Locale } from '$lib/i18n/types';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	let themeExpanded = $state(false);
	let languageExpanded = $state(false);
	let currentTheme = $state<string>('auto');
	let isAuthenticated = $state(false);

	$effect(() => {
		const savedTheme = localStorage.getItem('theme') || 'auto';
		currentTheme = savedTheme;
		applyTheme(savedTheme);

		const savedLocale = (localStorage.getItem('locale') as Locale) || 'pt-BR';
		i18n.setLocale(savedLocale);
	});

	const themes = [
		{ value: 'light', icon: '☀️' },
		{ value: 'auto', icon: '💻' },
		{ value: 'dark', icon: '🌙' }
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

	function setTheme(theme: string) {
		currentTheme = theme;
		localStorage.setItem('theme', theme);
		applyTheme(theme);
		themeExpanded = false;
	}

	function applyTheme(theme: string) {
		if (theme === 'light') {
			document.documentElement.setAttribute('data-theme', 'light');
		} else if (theme === 'dark') {
			document.documentElement.setAttribute('data-theme', 'dark');
		} else {
			document.documentElement.removeAttribute('data-theme');
		}
	}

	function setLanguage(locale: Locale) {
		i18n.setLocale(locale);
		localStorage.setItem('locale', locale);
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

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.profile-menu') && !target.closest('[aria-label*="erfil"]')) {
			onClose();
		}
	}

	$effect(() => {
		if (isOpen) {
			setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
			}, 10);

			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

{#if isOpen}
	<div class="profile-menu shadow" transition:slide={{ axis: 'y' }}>
		<section>
			<button class="collapsible" onclick={toggleTheme}>
				<span>
					🌙 {i18n.t.profile.theme.title}: <strong>{getThemeLabel(currentTheme)}</strong>
				</span>
				<span class="arrow" class:expanded={themeExpanded}>▼</span>
			</button>

			{#if themeExpanded}
				<div class="options" transition:slide={{ axis: 'y', duration: 200 }}>
					{#each themes as theme}
						<button class="option" class:active={currentTheme === theme.value} onclick={() => setTheme(theme.value)}>
							{theme.icon}
							{getThemeLabel(theme.value)}
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<section>
			<button class="collapsible" onclick={toggleLanguage}>
				<span>
					🌐 {i18n.t.profile.language.title}: <strong>{getLanguageLabel(i18n.locale)}</strong>
				</span>
				<span class="arrow" class:expanded={languageExpanded}>▼</span>
			</button>

			{#if languageExpanded}
				<div class="options" transition:slide={{ axis: 'y', duration: 200 }}>
					{#each languages as lang}
						<button class="option" class:active={i18n.locale === lang.value} onclick={() => setLanguage(lang.value)}>
							{lang.flag}
							{lang.label}
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<div class="separator"></div>

		<section class="links">
			<a href="/favorites">⭐ {i18n.t.profile.favorites}</a>
			<a href="/reviews">📝 {i18n.t.profile.reviews}</a>
			<a href="https://github.com/lucasmonsan/localista" target="_blank" rel="noopener noreferrer">
				ℹ️ {i18n.t.profile.about}
			</a>
		</section>

		<div class="separator"></div>

		<section class="action">
			{#if isAuthenticated}
				<button class="logout" onclick={() => console.log('logout')}>
					🚪 {i18n.t.profile.logout}
				</button>
			{:else}
				<button class="login" onclick={() => console.log('login')}>
					🔑 {i18n.t.profile.login}
				</button>
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
	}

	.separator {
		height: 1px;
		background: var(--border);
	}

	.links {
		gap: var(--xxxs);
	}

	.links a {
		display: block;
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

	.login,
	.logout {
		width: 100%;
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

	.logout {
		background: transparent;
		color: var(--error);

		&:hover {
			background: var(--bg);
		}
	}
</style>
