<script>
	import { page } from '$app/state';

	let { children } = $props();

	let showOverlay = $derived(page.url.pathname !== '/');
</script>

<main data-overlay={showOverlay}>
	{@render children()}
</main>

<style>
	main {
		z-index: var(--z-page);
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100dvh;
		pointer-events: none;
		user-select: none;

		:global(> *) {
			pointer-events: auto;
		}
	}

	main[data-overlay='true']::before {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--overlay);
		backdrop-filter: blur(8px);
		z-index: -1;
		pointer-events: auto;
	}
</style>
