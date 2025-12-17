<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Loader2 } from 'lucide-svelte';
	import LogoIcon from '$lib/icons/LogoIcon.svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';

	interface Props {
		show: boolean;
	}

	let { show = true }: Props = $props();

	let currentMessage = $derived(
		i18n.t.splash?.messages?.[Math.floor(Math.random() * (i18n.t.splash?.messages?.length || 1))] || 
		'Loading...'
	);
</script>

{#if show}
	<div class="splash" transition:fade={{ duration: 400 }}>
		<div class="content">
			<div class="logo">
				<LogoIcon />
			</div>
			<h1 class="app-name">{i18n.t.splash?.appName || 'Monsan Map'}</h1>
			<div class="loader animate-spin">
				<Loader2 size={32} />
			</div>
			<p class="loading-message">{currentMessage}...</p>
		</div>
	</div>
{/if}

<style>
	.splash {
		position: fixed;
		inset: 0;
		z-index: var(--z-splash);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg);
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--lg);
		text-align: center;
	}

	.logo {
		width: 120px;
		height: 120px;
		color: var(--brand-primary);
		animation: pulse 2s ease-in-out infinite;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.app-name {
		font-size: var(--xxxl);
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: -0.5px;
		background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.loader {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--brand-primary);
	}

	.loading-message {
		font-size: var(--sm);
		color: var(--text-secondary);
		font-style: italic;
		margin: 0;
		opacity: 0.8;
		animation: fadeInOut 3s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.9;
			transform: scale(1.03);
		}
	}

	@keyframes fadeInOut {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
</style>

